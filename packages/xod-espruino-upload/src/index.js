
import Espruino from 'espruino/espruino';

// Espruino object is constructed in several modules via global variable.
// So we have to just import few modules to get them executed.
import 'espruino/core/utils';
import 'espruino/core/config';
import 'espruino/core/serial';
import 'espruino/core/serial_chrome';
import 'espruino/core/serial_nodeserial';
import 'espruino/core/codeWriter';
import 'espruino/core/modules';
import 'espruino/core/env';

import co from 'co';

// TODO: now console is an only adequate way to debug hardware interaction
// so allow console.log while upload.
/* eslint-disable no-console */

/*
 * Helper wrapper functions to convert EspruinoTools’ callback-based routines
 * to promise-based
 */
function writeToEspruino(code) {
  return new Promise((resolve) => {
    Espruino.Core.CodeWriter.writeToEspruino(code, resolve);
  });
}

function serialOpen(port, disconnectedCallback) {
  return new Promise((resolve) => {
    Espruino.Core.Serial.open(port, resolve, disconnectedCallback);
  });
}

function transformForEspruino(code) {
  return new Promise((resolve) => {
    Espruino.callProcessor('transformForEspruino', code, resolve);
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function setProgressListener(progressCallback) {
  let status = '';
  let progress = 0;
  let progressMax = 1;

  const notify = () => {
    const percentage = (progress / progressMax) * 100;
    progressCallback(status, percentage);
  };

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

export default function upload(code, progressCallback) {
  const port = '/dev/ttyACM0';

  Espruino.Core.Serial.setSlowWrite(false);
  setProgressListener(progressCallback);

  return co(function* asyncUpload() {
    const espruinoCode = yield transformForEspruino(code);

    console.log('Code is about to be uploaded:\n', espruinoCode);

    Espruino.Core.Serial.startListening((arrayBuffer) => {
      const uintArray = new Uint8Array(arrayBuffer);
      const str = String.fromCharCode.apply(null, uintArray);
      console.log('Got', JSON.stringify(str));
    });

    const connectionInfo = yield serialOpen(
      port, () => console.log('Disconnected')
    );

    if (!connectionInfo) {
      throw new Error(`Failed to open serial port ${port}`);
    }

    // Give a chance for the board to see the connection,
    // issue a prompt, etc. 1000 ms looks like more than necessary
    // so it could be tweaked for optimization.
    yield delay(1000);

    // Clear any program that was saved as a plain JS code
    // since we want to save it as an interpreter dump
    yield writeToEspruino('E.setBootCode("");\n');

    // Write the code and save espruino interpreter state
    yield writeToEspruino([
      espruinoCode,
      'save();',
    ].join('\n'));

    // Give a chance to process and save the code.
    // 1000 ms could be lowered.
    yield delay(1000);

    Espruino.Core.Serial.close();

    removeProgressListener();
  });
}
