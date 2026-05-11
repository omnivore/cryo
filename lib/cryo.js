/**
 * JSON + Object references wrapper
 *
 * @author Hunter Loftis <hunter@skookum.com>
 * @license The MIT license.
 * @copyright Copyright (c) 2010 Skookum, skookum.com
 */

;(function() {

  var CONTAINER_TYPES = 'object array date function'.split(' ');

  var REFERENCE_FLAG = '_CRYO_REF_';
  var INFINITY_FLAG = '_CRYO_INFINITY_';
  var FUNCTION_FLAG = '_CRYO_FUNCTION_';
  var UNDEFINED_FLAG = '_CRYO_UNDEFINED_';
  var DATE_FLAG = '_CRYO_DATE_';

  var OBJECT_FLAG = '_CRYO_OBJECT_';
  var ARRAY_FLAG = '_CRYO_ARRAY_';

  function typeOf(item) {
    if (typeof item === 'object') {
      if (item === null) return 'null';
      if (item && item.nodeType === 1) return 'dom';
      if (item instanceof Array) return 'array';
      if (item instanceof Date) return 'date';
      return 'object';
    }
    return typeof item;
  }

  // Merge own enumerable properties from `source` into `obj`, only when
  // `obj[key]` is undefined. Mirrors _.defaults; kept local to avoid an
  // underscore dep.
  function defaults(obj) {
    var length = arguments.length;
    if (length < 2 || obj == null) return obj;
    for (var index = 1; index < length; index++) {
      var source = arguments[index];
      var keys = Object.keys(source);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (obj[key] === void 0) obj[key] = source[key];
      }
    }
    return obj;
  }

  function stringify(item, options) {
    // Backward compatibility: allow a function in place of options. Historical
    // callers passed a `prepare` callback directly.
    options = typeof options === 'function' ? { prepare: options } : options;
    options = defaults(options || {}, {
      prepare: null,
      isSerializable: function(item, key) {
        return item.hasOwnProperty(key);
      }
    });

    var references = [];
    var root = cloneWithReferences(item, references, options);

    return JSON.stringify({
      root: root,
      references: references
    });
  }

  function cloneWithReferences(item, references, options, savedItems) {
    if (options.prepare) { options.prepare(item); }

    savedItems = savedItems || [];
    var type = typeOf(item);

    // can this object contain its own properties?
    if (CONTAINER_TYPES.indexOf(type) !== -1) {
      var referenceIndex = savedItems.indexOf(item);
      // do we need to store a new reference to this object?
      if (referenceIndex === -1) {
        var clone = {};
        // Register the reference before recursing so cycles are caught by the
        // savedItems.indexOf check on re-entry. Recursing first would overflow
        // on any self-referential graph (e.g. Backbone models with _events).
        referenceIndex = references.push({
          contents: clone,
          value: wrapConstructor(item)
        }) - 1;
        savedItems[referenceIndex] = item;
        for (var key in item) {
          if (options.isSerializable(item, key)) {
            clone[key] = cloneWithReferences(item[key], references, options, savedItems);
          }
        }
      }

      // return something like _CRYO_REF_22
      return REFERENCE_FLAG + referenceIndex;
    }

    // return a non-container object
    return wrap(item);
  }

  function parse(string, options) {
    // Backward compatibility: allow a function in place of options. Historical
    // callers passed a `finalize` callback directly.
    options = typeof options === 'function' ? { finalize: options } : options;
    options = defaults(options || {}, { finalize: null });

    var json = JSON.parse(string);

    return rebuildFromReferences(json.root, json.references, options);
  }

  function rebuildFromReferences(item, references, options, restoredItems) {
    restoredItems = restoredItems || [];
    if (starts(item, REFERENCE_FLAG)) {
      var referenceIndex = parseInt(item.slice(REFERENCE_FLAG.length), 10);
      if (!restoredItems.hasOwnProperty(referenceIndex)) {
        var ref = references[referenceIndex];
        var container = unwrapConstructor(ref.value);
        // Register before recursing so cyclic references resolve to the
        // partially-populated container rather than overflowing.
        restoredItems[referenceIndex] = container;
        var contents = ref.contents;
        for (var key in contents) {
          container[key] = rebuildFromReferences(contents[key], references, options, restoredItems);
        }
        if (options.finalize) { options.finalize(container); }
      }
      return restoredItems[referenceIndex];
    }
    return unwrap(item);
  }

  function wrap(item) {
    var type = typeOf(item);
    if (type === 'undefined') return UNDEFINED_FLAG;
    if (type === 'function') return FUNCTION_FLAG + item.toString();
    if (type === 'date') return DATE_FLAG + item.getTime();
    if (item === Infinity) return INFINITY_FLAG;
    if (type === 'dom') return undefined;
    return item;
  }

  function wrapConstructor(item) {
    var type = typeOf(item);
    if (type === 'function' || type === 'date') return wrap(item);
    if (type === 'object') return OBJECT_FLAG;
    if (type === 'array') return ARRAY_FLAG;
    return item;
  }

  function unwrapConstructor(val) {
    if (typeOf(val) === 'string') {
      if (val === UNDEFINED_FLAG) return undefined;
      if (starts(val, FUNCTION_FLAG)) {
        var fn = val.slice(FUNCTION_FLAG.length);
        var argStart = fn.indexOf('(') + 1;
        var argEnd = fn.indexOf(')', argStart);
        var args = fn.slice(argStart, argEnd);
        var bodyStart = fn.indexOf('{') + 1;
        var bodyEnd = fn.lastIndexOf('}') - 1;
        var body = fn.slice(bodyStart, bodyEnd);
        return new Function(args, body);
      }
      if (starts(val, DATE_FLAG)) {
        var dateNum = parseInt(val.slice(DATE_FLAG.length), 10);
        return new Date(dateNum);
      }
      if (starts(val, OBJECT_FLAG)) {
        return {};
      }
      if (starts(val, ARRAY_FLAG)) {
        return [];
      }
      if (val === INFINITY_FLAG) return Infinity;
    }
    return val;
  }

  function unwrap(val) {
    if (typeOf(val) === 'string') {
      if (val === UNDEFINED_FLAG) return undefined;
      if (starts(val, FUNCTION_FLAG)) {
        var fn = val.slice(FUNCTION_FLAG.length);
        var argStart = fn.indexOf('(') + 1;
        var argEnd = fn.indexOf(')', argStart);
        var args = fn.slice(argStart, argEnd);
        var bodyStart = fn.indexOf('{') + 1;
        var bodyEnd = fn.lastIndexOf('}') - 1;
        var body = fn.slice(bodyStart, bodyEnd);
        return new Function(args, body);
      }
      if (starts(val, DATE_FLAG)) {
        var dateNum = parseInt(val.slice(DATE_FLAG.length), 10);
        return new Date(dateNum);
      }
      if (val === INFINITY_FLAG) return Infinity;
    }
    return val;
  }

  function starts(string, prefix) {
    return typeOf(string) === 'string' && string.slice(0, prefix.length) === prefix;
  }

  function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  // Exported object
  var Cryo = {
    stringify: stringify,
    parse: parse
  };

  // global on server, window in browser
  var root = this;

  // AMD / RequireJS
  if (typeof define !== 'undefined' && define.amd) {
    define('Cryo', [], function () {
      return Cryo;
    });
  }

  // node.js
  else if (typeof module !== 'undefined' && module.exports) {
    module.exports = Cryo;
  }

  // included directly via <script> tag
  else {
    root.Cryo = Cryo;
  }

})();
