install:
	npm install
	cd packages/xod-core             && npm install
	cd packages/xod-espruino         && npm install
	cd packages/xod-client           && npm install
	cd packages/xod-server           && npm install
	cd packages/xod-client-browser   && npm install
	cd packages/xod-client-chrome    && npm install
	cd packages/xod-client-electron  && npm install

build:
	cd packages/xod-core             && npm run build
	cd packages/xod-espruino         && npm run build
	cd packages/xod-client-browser   && npm run build
	cd packages/xod-client-chrome    && npm run build
	cd packages/xod-client-electron  && npm run build

test:
	cd packages/xod-core             && npm run test
	cd packages/xod-espruino         && npm run test
	cd packages/xod-client           && npm run test
	cd packages/xod-server           && npm run test

lint:
	cd packages/xod-core             && npm run lint
	cd packages/xod-espruino         && npm run lint
	cd packages/xod-client           && npm run lint
	cd packages/xod-server           && npm run lint
	cd packages/xod-client-browser   && npm run lint
	cd packages/xod-client-chrome    && npm run lint
	cd packages/xod-client-electron  && npm run lint

start-electron:
	cd packages/xod-client-electron  && npm start

dev-core:
	cd packages/xod-core     && npm run dev

dev-espruino:
	cd packages/xod-espruino && npm run dev

dev-client:
	cd packages/xod-client   && npm run dev

dev-client-browser:
	cd packages/xod-client-browser   && npm run dev

dev-server:
	cd packages/xod-server   && npm run dev

dev:
	npm run concurrently -- \
		--kill-others \
		--prefix name \
		--names "core,espruino,client,server,browser" \
		"make dev-core" \
		"make dev-espruino" \
		"make dev-client" \
		"make dev-server" \
		"make dev-client-browser"

ci: install build lint test

.PHONY:
	install build test lint dev-core dev-espruino dev-client dev-server dev ci
