import { def } from './types';
import runTranspile from './transpiler';

import nodejsLauncher from '../platform/nodejs/launcher';

/**
 * Runs transpilation for NodeJS target.
 *
 * @function transpileForNodeJS
 * @param {Project} project Whole project
 * @param {Path} path Path of entry-point patch
 * @returns {Either<Error,String>} Transpiled code or Error
 */
export default def(
  'transpileForNodeJS :: Project -> PatchPath -> Either Error String',
  (project, path) => runTranspile({
    project,
    path,
    impls: ['nodejs', 'js'],
    launcher: nodejsLauncher,
  })
);
