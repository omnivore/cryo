# Cryo

Easily serialize and deserialize JavaScript objects.

Built for node.js and browsers. Cryo is inspired by Python's pickle and works similarly to JSON.stringify() and JSON.parse().
Cryo.stringify() and Cryo.parse() handle these additional circumstances:

- [Undefined](#undefined)
- [Date](#date)
- [Infinity](#infinity)
- [Object references](#references)
- [Functions](#functions)
- [Attached properties](#properties)

## Installation

### node.js

```
$ npm install cryo
```

### browser

Add the [latest minified build](https://github.com/hunterloftis/cryo/tree/master/build) to your project as a script:

```html
<script type='text/javascript' src='cryo-0.0.3.min.js'></script>
```

## Example

```js
var Cryo = require('cryo');

var obj = {
  name: 'Hunter',
  hello: function() {
    console.log(this.name + ' says hello!');
  }
};

var frozen = Cryo.stringify(obj);
var hydrated = Cryo.parse(frozen);

hydrated.hello(); // Hunter says hello!
```

## More powerful JSON

### Undefined

`JSON.stringify()` loses properties that are `undefined`.
Cryo takes a verbatim snapshot of all your properties, including those that are `undefined`.

### Date

Cryo successfully works with `Date` objects, which `JSON.stringify()` mangles into strings.

```js
var Cryo = require('../lib/cryo');

var now = new Date();

var withJSON = JSON.parse(JSON.stringify(now));
console.log(withJSON instanceof Date);              // false

var withCryo = Cryo.parse(Cryo.stringify(now));
console.log(withCryo instanceof Date);              // true
```

### References

`JSON.stringify()` makes multiple copies of single objects, losing object relationships.
When several references to the same object are stringified with JSON, those references are turned into clones of each other.
Cryo maintains object references so the restored objects are identical to the originals.
This is easier to understand with an example:

```js
var Cryo = require('../lib/cryo');

var userList = [{ name: 'Abe' }, { name: 'Bob' }, { name: 'Carl' }];
var state = {
  users: userList,
  activeUser: userList[1]
};

var withJSON = JSON.parse(JSON.stringify(state));
console.log(withJSON.activeUser === withJSON.users[1]);   // false

var withCryo = Cryo.parse(Cryo.stringify(state));
console.log(withCryo.activeUser === withCryo.users[1]);   // true
```

### Infinity

`JSON.stringify(Infinity)` returns `null`, even though `Infinity` is a numeric type in JavaScript.
Cryo successfully stringifies and parses `Infinity` as a `Number`.

### Functions

### Properties



## Tests

Tests require node.js.

```
$ git clone git://github.com/hunterloftis/cryo.git
$ cd cryo
$ make setup
$ make test
```