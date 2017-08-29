import R from 'ramda';
import { mapIndexed } from 'xod-func-tools';

// :: [{...}] -> [{..., index: N}] -- sets each element in array a property 'index'
export const assocIndexes = mapIndexed(R.flip(R.assoc('index')));

// :: [obj] -> { obj.id: obj, ... } -- transform array into object indexed by element.id
export const indexById = R.indexBy(R.prop('id'));
