import R from 'ramda';
import { def } from './types';

/**
 * Checks if an element is among elements of a list
 */
export const isAmong = def(
  'isAmong :: [a] -> a -> Boolean',
  R.flip(R.contains)
);

/**
 * Maps an array using a mapping function that on each iteration step receives
 * an array element, its index, and the whole array itself
 */
// :: ((a, Number, [a]) -> b) -> [a] -> [b]
export const mapIndexed = R.addIndex(R.map);

/**
 * Swaps two elements of `array` having `oldIndex` and `newIndex` indexes.
 */
// :: Number -> Number -> [a] -> [a]
export const swap = def(
  'swap :: Number -> Number -> [a] -> [a]',
  (oldIndex, newIndex, array) => {
    const len = array.length;
    if (oldIndex >= len || newIndex >= len) {
      throw new Error(`Can not swap items that out of an array: ${oldIndex} > ${newIndex}. Array length: ${len}.`);
    }

    const oldItem = R.nth(oldIndex, array);
    const newItem = R.nth(newIndex, array);

    return R.pipe(
      R.update(oldIndex, newItem),
      R.update(newIndex, oldItem)
    )(array);
  }
);

/**
 * Returns the list of list of strings.
 * Removes all duplicates from the subsequent list
 * on the basis of already filtered values lists.
 *
 * E.G.
 * [['a', 'b', 'c'], ['b','c','d'], ['a','d','e']]
 * will become
 * [['a', 'b', 'c'], ['d'], ['e']]
 */
export const uniqLists = def(
  'uniqLists :: [[String]] -> [[String]]',
  R.reduce(
    (acc, nextList) => R.append(
      R.without(R.unnest(acc), nextList),
      acc
    ),
    []
  )
);
