import * as R from 'ramda';
import { noop, createError } from 'xod-func-tools';
import { prepareModuleOptions, ERROR_CODES } from 'xod-cloud-compile';

const getRuntimeUrl = suite => R.path(['artifactUrls', 'main.js'], suite);
const getWasmUrl = suite => R.path(['artifactUrls', 'main.wasm'], suite);

const runWasmWorker = (suite, onLaunch) =>
  new Promise((resolve, reject) => {
    // Require worker dynamically to avoid errors in tests
    // eslint-disable-next-line
    const WasmWorker = require('./wasm.worker');

    const stdout = [];
    const stderr = [];

    const runtimeUrl = getRuntimeUrl(suite);
    if (!runtimeUrl) {
      reject(createError(ERROR_CODES.WASM_NO_RUNTIME_FOUND, { suite }));
      return;
    }
    const wasmUrl = getWasmUrl(suite);
    if (!wasmUrl) {
      reject(createError(ERROR_CODES.WASM_BINARY_NOT_FOUND, { suite }));
      return;
    }

    const worker = new WasmWorker();
    worker.postMessage({
      type: 'init',
      payload: {
        suite: prepareModuleOptions(suite),
        runtimeUrl,
        wasmUrl,
      },
    });

    worker.onReceive = noop;

    const handlers = {
      'serial:receive': data => worker.onReceive(data),
      data: x => stdout.push(x),
      error: x => stderr.push(x),
      quit: exitCode => {
        if (exitCode === 0 && stderr.length === 0) {
          resolve({ stdout, stderr, worker });
        } else {
          reject(
            createError(ERROR_CODES.WASM_NONZERO_EXIT_CODE, {
              stdout,
              stderr,
              exitCode,
              worker,
            })
          );
        }
      },
    };

    worker.sendToWasm = str =>
      worker.postMessage({
        type: 'serial:send',
        payload: str,
      });

    worker.onmessage = e =>
      R.propOr(noop, e.data.type, handlers)(e.data.payload);

    // For unhandled errors in WebWorker
    worker.onerror = e => {
      R.propOr(noop, 'error', handlers)(e.message);
      handlers.quit(1);
    };

    onLaunch(worker);
  });

export default runWasmWorker;
