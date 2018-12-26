import * as R from 'ramda';
import str2ab from 'string-to-arraybuffer';
import { createError } from 'xod-func-tools';

import * as EC from './errorCodes';
import Runtime from '../vendor/runtime';

// :: { artifacts: { wasmBinary: "..." }, options: { ... } } -> Promise Error { stdout, stderr }
const runSuite = compiledSuite => {
  const stdout = [];
  const stderr = [];

  return new Promise((resolve, reject) => {
    const Module = R.merge(
      {
        wasmBinary: str2ab(compiledSuite.artifacts.wasmBinary),
        noFSInit: false,
        noExitRuntime: false,
        arguments: ['-e'],
        onAbort: () =>
          reject(createError(EC.TABTEST_EXECUTION_ABORT, { stdout, stderr })),
        print: msg => stdout.push(msg),
        printErr: msg => stderr.push(msg),
        postRun: () => resolve({ stdout, stderr }),
        quit: exitCode => {
          if (exitCode === 0) {
            resolve({ stdout, stderr });
          } else {
            reject(
              createError(EC.TABTEST_NONZERO_EXIT_CODE, {
                stdout,
                stderr,
                exitCode,
              })
            );
          }
        },
      },
      compiledSuite.options
    );
    // eslint-disable-next-line no-new
    new Runtime(Module);
  });
};

export default runSuite;
