install:
	cd xod-espruino && npm install
	cd xod-core && npm install
	cd xod-client && npm install

build:
	cd xod-espruino && npm run build
	cd xod-core && npm run build
	cd xod-client && npm run build

test:
	cd xod-espruino && npm run test
	cd xod-core && npm run test
	cd xod-client && npm run test

lint:
	cd xod-espruino && npm run lint
	cd xod-core && npm run lint
	cd xod-client && npm run lint

start: build
	cd xod-client && npm run start

ci: install build lint test

.PHONY:
	ci lint test start build install
