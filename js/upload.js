
import { transpilePatch } from '../targets/espruino/patch-transpiler.js';

export function sendPatchToEspruino(patch) {
  let code = transpilePatch(patch.data());
  console.log('Generated code:', code);

  function onConnected() {
    Espruino.Core.CodeWriter.writeToEspruino(code, () => {
      console.log('*** Sent ***'); 
      setTimeout(() => Espruino.Core.Serial.close(), 1000);
    });
  }

  function onDisconnected() {
    console.log('*** Disconnected ***'); 
  }

  function openAndSend() {
    Espruino.Core.Serial.startListening(x => console.log('→→', x));
    Espruino.Core.Serial.open('/dev/ttyACM0', onConnected, onDisconnected);
  }

  // FIXME: ultra hard code
  Espruino.Config.set('MODULE_URL', 'http://localhost:3001/modules');
  Espruino.Config.set('BOARD_JSON_URL', 'http://js.amperka.ru/json');
  Espruino.Config.set('MODULE_EXTENSIONS', '.js');
  Espruino.Core.Serial.setSlowWrite(false);
  Espruino.callProcessor("transformForEspruino", code, (newCode) => {
    code = newCode;
    console.log('Code to be sent:', code);
    openAndSend();
  });
}
