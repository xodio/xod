import { def } from './types';
import runTranspile from './transpiler';

import espruinoLauncher from '../platform/espruino/launcher';

/**
 * Runs transpilation for Espruino target.
 *
 * @function transpileForEspruino
 * @param {Project} project Whole project (v2)
 * @param {Path} path Path of entry-point patch
 * @returns {String} Transpiled code
 */
export default def(
  'transpileForEspruino :: Project -> PatchPath -> String',
  (project, path) => runTranspile({
    project,
    path,
    impls: ['espruino', 'js'],
    launcher: espruinoLauncher,
  })
);
