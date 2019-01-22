// This file is a WASM web worker implementation.
// The worker is imported as a usual JS module by worker-loader.
// In this case tests fail with ReferenceError "self is not defined".
// To avoid this we define _self as self for worker, or an empty object
// for tests and etc.
// eslint-disable-next-line
var _self = (typeof self === 'undefined') ? {} : self;

let wasmInstance;
_self.onmessage = e => {
  switch (e.data.type) {
    case 'init': {
      const { suite, runtimeUrl } = e.data.payload;
      _self.importScripts(runtimeUrl);
      const opts = Object.assign(suite, {
        onAbort: x =>
          _self.postMessage({
            type: 'abort',
            payload: x,
          }),
        print: x =>
          _self.postMessage({
            type: 'data',
            payload: x,
          }),
        printErr: x =>
          _self.postMessage({
            type: 'error',
            payload: x,
          }),
        quit: exitCode =>
          _self.postMessage({
            type: 'quit',
            payload: exitCode,
          }),
        postRun: () => wasmInstance.quit(0),
      });

      // Module is defined in `importScripts(...)`
      // eslint-disable-next-line no-undef
      wasmInstance = new Module(opts);
      return;
    }
    default:
      return;
  }
};
