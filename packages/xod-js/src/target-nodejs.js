import { def } from './types';
import runTranspile from './transpiler';

import nodejsLauncher from '../platform/nodejs/launcher';

/**
 * Runs transpilation for NodeJS target.
 *
 * @function transpileForNodeJS
 * @param {Project} project Whole project (v2)
 * @param {Path} path Path of entry-point patch
 * @returns {String} Transpiled code
 */
export default def(
  'transpileForNodeJS :: Project -> PatchPath -> String',
  (project, path) => runTranspile({
    project,
    path,
    impls: ['nodejs', 'js'],
    launcher: nodejsLauncher,
  })
);
