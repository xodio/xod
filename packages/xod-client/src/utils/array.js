import R from 'ramda';

// :: (item, index) -> [a] -> [a] -- map an array with index
const mapIndexed = R.addIndex(R.map);

// :: [a] -> [a] -- swaps two elements of `array` having `oldIndex` and `newIndex` indexes.
export const swap = R.curry(
  (oldIndex, newIndex, array) => {
    const oldItem = R.nth(oldIndex, array);
    const newItem = R.nth(newIndex, array);

    return R.pipe(
      R.update(oldIndex, newItem),
      R.update(newIndex, oldItem)
    )(array);
  }
);

// :: [{...}] -> [{..., index: N}] -- sets each element in array a property 'index'
export const assocIndexes = mapIndexed(R.flip(R.assoc('index')));

// :: [obj] -> { obj.id: obj, ... } -- transform array into object indexed by element.id
export const indexById = R.indexBy(R.prop('id'));
