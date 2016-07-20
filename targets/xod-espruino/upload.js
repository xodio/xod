
import Espruino from "espruino/espruino";
//
// Espruino object is constructed in several modules via global variable.
// So we have to just import few modules to get them executed.
import "espruino/core/utils.js";
import "espruino/core/config.js";
import "espruino/core/serial.js";
import "espruino/core/serial_chrome.js";
import "espruino/core/codeWriter.js";
import "espruino/core/modules.js";
import "espruino/core/env.js";

import co from 'co';
import transpile from './transpiler';

/*
 * Helper wrapper functions to convert EspruinoTools’ callback-based routines
 * to promise-based 
 */
function writeToEspruino(code) {
  return new Promise((resolve, reject) => {
    Espruino.Core.CodeWriter.writeToEspruino(code, resolve);
  });
}

function serialOpen(port, disconnectedCallback) {
  return new Promise((resolve, reject) => {
    Espruino.Core.Serial.open(port, resolve, disconnectedCallback);
  });
}

function transformForEspruino(code) {
  return new Promise((resolve, reject) => {
    Espruino.callProcessor("transformForEspruino", code, resolve);
  });
}

function delay(ms) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms));
}

function onDisconnected() {
  console.log('@@@ Disconnected'); 
}

function setProgressListener(progressCallback) {
  let status = '';
  let progress = 0;
  let progressMax = 1;

  const notify = () => {
    const percentage = progress / progressMax * 100;
    progressCallback(status, percentage);
  }

  Espruino.Core.Status = {
    setStatus: (newStatus, maxAmount) => {
      status = newStatus;
      if (maxAmount) {
        progressMax = maxAmount;
      }

      notify();
    },

    incrementProgress: (amount) => {
      progress += amount;
      notify();
    },
  };
}

function removeProgressListener() {
  Espruino.Core.Status = null;
}

export function upload(project, progressCallback) {
  const code = transpile(project);
  const port = '/dev/ttyACM0';

  Espruino.Core.Serial.setSlowWrite(false);
  setProgressListener(progressCallback);

  return co(function*() {
    const transformedCode = yield transformForEspruino(code);

    // Due to implementation of EspruinoTools we have to listen serial
    // Just do nothing with incomming data
    Espruino.Core.Serial.startListening(_ => null);

    const connectionInfo = yield serialOpen(port, onDisconnected);
    if (!connectionInfo) {
      throw new Error(`Failed to open serial port ${port}`);
    }

    yield writeToEspruino(transformedCode);

    yield delay(1000);
    Espruino.Core.Serial.close();

    removeProgressListener();
  });
}
