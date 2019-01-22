import * as R from 'ramda';
import { noop, createError } from 'xod-func-tools';
import { prepareModuleOptions, ERROR_CODES } from 'xod-cloud-tabtest';

import WasmWorker from './wasm.worker';

const runWasmWorker = (suite, onLaunch) =>
  new Promise((resolve, reject) => {
    const stdout = [];
    const stderr = [];

    const runtimeUrl = R.path(['artifactUrls', 'wasmRuntimeMin'], suite);
    if (!runtimeUrl) {
      reject(createError(ERROR_CODES.WASM_NO_RUNTIME_FOUND, { suite }));
      return;
    }

    const worker = new WasmWorker();

    worker.postMessage({
      type: 'init',
      payload: {
        suite: prepareModuleOptions(suite),
        runtimeUrl,
      },
    });

    const handlers = {
      data: x => stdout.push(x),
      error: x => stderr.push(x),
      quit: exitCode => {
        if (exitCode === 0 && stderr.length === 0) {
          resolve({ stdout, stderr, worker });
        } else {
          reject(
            createError(ERROR_CODES.TABTEST_NONZERO_EXIT_CODE, {
              stdout,
              stderr,
              exitCode,
              worker,
            })
          );
        }
      },
    };

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
