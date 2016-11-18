import runTranspile from './transpiler';

import jsRuntime from '../platform/runtime';
import nodejsLauncher from '../platform/nodejs/launcher';

export default function transpile(project) {
  return runTranspile({
    project,
    runtime: jsRuntime,
    launcher: nodejsLauncher,
  });
}
