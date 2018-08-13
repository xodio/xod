import UPDATE_HINTING from './actionType';

export default (deducedTypes, errors) => ({
  type: UPDATE_HINTING,
  payload: { deducedTypes, errors },
});
