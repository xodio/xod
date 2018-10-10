import * as R from 'ramda';
import { roundTo } from 'xod-func-tools';

// ProgressData :: { note: String, total: Number, current: Number, percentage: Number }

/**
 * Returns a function, which increments the current step on each call and
 * returns a new object with `ProgressData`.
 *
 * :: Number -> (String -> ProgressData)
 */
export default total => {
  let current = 0;

  /**
   * Increments `current` and returns `ProgressData`.
   * :: String -> ProgressData
   */
  const next = note => {
    current += 1;
    return {
      total,
      current,
      note,
      percentage: roundTo(2, current / total),
    };
  };

  /**
   * Utility
   * Increments `current` and returns `ProgressData`.
   * But accepts `ProgressData` as the argument.
   *
   * Handy when some function with progress uses another function with
   * progress and we need to get a truthy percentage over the whole process.
   *
   * :: ProgressData -> ProgressData
   */
  const wrap = R.pipe(R.prop('note'), next);

  const fn = note => next(note);
  fn.wrap = data => wrap(data);
  return fn;
};
