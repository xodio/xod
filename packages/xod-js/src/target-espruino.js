import runTranspile from './transpiler';

import jsRuntime from '../platform/runtime';
import espruinoLauncher from '../platform/espruino/launcher';

export default function transpile(project) {
  return runTranspile({
    project,
    impls: ['espruino', 'js'],
    runtime: jsRuntime,
    launcher: espruinoLauncher,
  });
}
