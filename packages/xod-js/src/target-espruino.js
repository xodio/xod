import runTranspile from './transpiler';

import espruinoLauncher from '../platform/espruino/launcher';

/**
 * Runs transpilation for Espruino target.
 *
 * @function transpile
 * @param {Project} project Whole project (v2)
 * @param {Path} path Path of entry-point patch
 * @returns {String} Transpiled code
 */
export default function transpile(project, path) {
  return runTranspile({
    project,
    path,
    impls: ['espruino', 'js'],
    launcher: espruinoLauncher,
  });
}
