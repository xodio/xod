install:
	npm install
	cd xod-core             && npm install
	cd xod-espruino         && npm install
	cd xod-client           && npm install
	cd xod-server           && npm install
	cd xod-client-browser   && npm install
	cd xod-client-chrome    && npm install
	cd xod-client-electron  && npm install

build:
	cd xod-core             && npm run build
	cd xod-espruino         && npm run build
	cd xod-client-browser   && npm run build
	cd xod-client-chrome    && npm run build
	cd xod-client-electron  && npm run build

test:
	cd xod-core             && npm run test
	cd xod-espruino         && npm run test
	cd xod-client           && npm run test
	cd xod-server           && npm run test

lint:
	cd xod-core             && npm run lint
	cd xod-espruino         && npm run lint
	cd xod-client           && npm run lint
	cd xod-server           && npm run lint
	cd xod-client-browser   && npm run lint
	cd xod-client-chrome    && npm run lint
	cd xod-client-electron  && npm run lint

start-electron:
	cd xod-core             && npm run build
	cd xod-espruino         && npm run build
	cd xod-client-browser   && npm run build
	cd xod-client-electron  && npm run build && npm start

dev-core:
	cd xod-core     && npm run dev

dev-espruino:
	cd xod-espruino && npm run dev

dev-client:
	cd xod-client   && npm run dev

dev-browser:
	cd xod-core             && npm run build
	cd xod-espruino         && npm run build
	cd xod-client-browser   && npm run dev

dev-server:
	cd xod-server   && npm run dev

dev:
	npm run concurrently -- \
		--kill-others \
		--prefix name \
		--names "core,espruino,client,server" \
		"make dev-core" \
		"make dev-espruino" \
		"make dev-client" \
		"make dev-server"

ci: install build lint test

.PHONY:
	install build test lint dev-core dev-espruino dev-client dev-server dev ci
