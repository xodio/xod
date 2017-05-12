import { def } from './types';
import runTranspile from './transpiler';

import espruinoLauncher from '../platform/espruino/launcher';

/**
 * Runs transpilation for Espruino target.
 *
 * @function transpileForEspruino
 * @param {Project} project Whole project
 * @param {Path} path Path of entry-point patch
 * @returns {Either<Error,String>} Transpiled code or Error
 */
export default def(
  'transpileForEspruino :: Project -> PatchPath -> Either Error String',
  (project, path) => runTranspile({
    project,
    path,
    impls: ['espruino', 'js'],
    launcher: espruinoLauncher,
  })
);
