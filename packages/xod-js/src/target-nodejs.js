import runTranspile from './transpiler';

import nodejsLauncher from '../platform/nodejs/launcher';

/**
 * Runs transpilation for NodeJS target.
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
    impls: ['nodejs', 'js'],
    launcher: nodejsLauncher,
  });
}
