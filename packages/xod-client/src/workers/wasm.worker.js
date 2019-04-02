// This file is a WASM web worker implementation.
// The worker is imported as a usual JS module by worker-loader.
// In this case tests fail with ReferenceError "self is not defined".
// To avoid this we define _self as self for worker, or an empty object
// for tests and etc.
// eslint-disable-next-line
var _self = (typeof self === 'undefined') ? {} : self;

// Serial object provides communication between WASM and JS
// It used only in Simulation, but to avoid creating similar
// worker file for Tabtests it's here permanently.
const Serial = {
  // eslint-disable-next-line no-undef
  encoder: new TextEncoder('utf-8'),
  // eslint-disable-next-line no-undef
  decoder: new TextDecoder('utf-8'),
  txBuffer: new Uint8Array(0),
  // Methods to be called from WASM
  wasm: {
    // How much bytes are available to read
    available: () => Serial.txBuffer.length,
    peek: () => {
      if (Serial.txBuffer.length === 0) {
        return -1;
      }
      return Serial.txBuffer.slice(0, 1);
    },
    // Read Bytes from JS into WASM (called by WASM)
    readBytes: bytes => {
      const result = Serial.txBuffer.slice(0, bytes);
      Serial.txBuffer = Serial.txBuffer.slice(bytes);
      return result;
    },
    // Receive Smth from WASM into JS
    writeString: str => Serial.onReceive(str),
    writeByte: byte =>
      Serial.onReceive(Serial.decoder.decode(new Uint8Array([byte]))),
  },
  // Methods to be called from JS
  js: {
    // Write String to send to WASM
    writeString: str => {
      const newStr = Serial.encoder.encode(str);
      const newBuf = new Uint8Array(Serial.txBuffer.length + newStr.length);
      newBuf.set(Serial.txBuffer, 0);
      newBuf.set(newStr, Serial.txBuffer.length);
      Serial.txBuffer = newBuf;
      return Serial.txBuffer.length;
    },
  },
  // JS Handlers
  onReceive: data =>
    _self.postMessage({
      type: 'serial:receive',
      payload: data,
    }),
};

let wasmInstance;
_self.onmessage = e => {
  switch (e.data.type) {
    case 'init': {
      const { suite, runtimeUrl, wasmUrl } = e.data.payload;
      _self.importScripts(runtimeUrl);
      const opts = Object.assign(suite, {
        // Make possible downloading of wasmFile from dedicated webserver:
        locateFile: () => wasmUrl,
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
      wasmInstance.Serial = Serial;
      return;
    }
    case 'serial:send': {
      const newLen = Serial.js.writeString(e.data.payload);
      _self.postMessage({
        type: 'serial:sendOk',
        payload: newLen,
      });
      return;
    }
    default:
      return;
  }
};
