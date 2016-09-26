install:
	cd xod-core     && npm install
	cd xod-espruino && npm install
	cd xod-client   && npm install
#	cd xod-server   && npm install

build:
	cd xod-core     && npm run build
	cd xod-espruino && npm run build
	cd xod-client   && npm run build
#	cd xod-server   && npm run build

test:
	cd xod-core     && npm run test
	cd xod-espruino && npm run test
	cd xod-client   && npm run test
#	cd xod-server   && npm run test

lint:
	cd xod-core     && npm run lint
	cd xod-espruino && npm run lint
	cd xod-client   && npm run lint
#	cd xod-server   && npm run lint

dev-core:
	cd xod-core     && npm run dev

dev-espruino:
	cd xod-espruino && npm run dev

dev-client:
	cd xod-client   && npm run dev

dev-server:
	cd xod-server   && npm run dev

dev:
	npm run concurrently -- "make dev-core" "make dev-espruino" "make dev-client"

ci: install build lint test

.PHONY:
	install build test lint dev-core dev-espruino dev-client dev-server dev ci
