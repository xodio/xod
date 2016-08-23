import R from 'ramda';

const mapIndexed = R.addIndex(R.map);

export const arrayMoveIndex = R.curry(
  (oldIndex, newIndex, array) => {
    const oldItem = R.nth(oldIndex, array);
    const newItem = R.nth(newIndex, array);

    return R.pipe(
      R.update(oldIndex, newItem),
      R.update(newIndex, oldItem)
    )(array);
  }
);

export const arrayUpdateIndex = mapIndexed((item, index) => R.assoc('index', index, item));

export const arrayIndexById = R.indexBy(R.prop('id'));
