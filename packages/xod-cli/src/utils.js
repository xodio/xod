import * as R from 'ramda';

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

export default { runCommand };
