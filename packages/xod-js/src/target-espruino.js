import runTranspile from './transpiler';

import espruinoLauncher from '../platform/espruino/launcher';

export default function transpile(project) {
  return runTranspile({
    project,
    impls: ['espruino', 'js'],
    launcher: espruinoLauncher,
  });
}
