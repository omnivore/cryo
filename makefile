VERSION=0.0.5
SRC=lib/cryo.js
DEV=build/cryo-$(VERSION).js

setup:
	npm install

test:
	node_modules/.bin/mocha -R spec --bail ./test/*.test.js
	open test/browser.html

build:
	@echo "Development: $(DEV)"

	@cat $(SRC) > $(DEV)

.PHONY: setup test build
