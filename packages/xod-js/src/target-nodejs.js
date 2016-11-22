import runTranspile from './transpiler';

import nodejsLauncher from '../platform/nodejs/launcher';

export default function transpile(project) {
  return runTranspile({
    project,
    impls: ['nodejs', 'js'],
    launcher: nodejsLauncher,
  });
}
