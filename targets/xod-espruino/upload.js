
import Espruino from "espruino/espruino";
import "espruino/core/utils.js";
import "espruino/core/config.js";
import "espruino/core/serial.js";
import "espruino/core/serial_chrome.js";
//import "espruino/core/serial_chrome_pre_m33.js";
//import "espruino/core/serial_audio.js";
//import "espruino/core/serial_socket.js";
//import "espruino/core/serial_bleat.js";
//import "espruino/core/serial_nodeserial.js";
import "espruino/core/codeWriter.js";
//import "espruino/core/modules.js";
import "espruino/core/env.js";

import transpile from './transpiler';

export function upload(data) {
  const s = transpile(data);
  console.log(s);
}
