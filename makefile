VERSION=0.1.0
SRC=lib/cryo.js
DEV=build/cryo-$(VERSION).js

setup:
	npm install

test:
	npm test

build:
	@echo "Development: $(DEV)"

	@cat $(SRC) > $(DEV)

.PHONY: setup test build
