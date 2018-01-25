import * as R from 'ramda';
import { expandHomeDir, DEFAULT_WORKSPACE_PATH } from 'xod-fs';

/**
 * Picks a program by command and run it.
 *
 * @function
 * @param {Object.<String, Boolean>} options
 * @param {Object.<String, Function>} programs
 */
export const runCommand = R.uncurryN(2, options =>
  R.mapObjIndexed(
    (fn, command) => R.when(
      R.compose(R.equals(true), R.prop(R.__, options)),
      R.tap(() => fn(options))
    )(command)
  )
);

// :: Nullable Path -> Path
export const getWorkspacePath = R.compose(
  expandHomeDir,
  R.defaultTo(
    process.env.XOD_WORKSPACE || DEFAULT_WORKSPACE_PATH
  )
);

export default { runCommand };
