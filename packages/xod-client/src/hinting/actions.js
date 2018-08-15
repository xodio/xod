import UPDATE_HINTING from './actionType';

export default (deducedTypes, errors, patchSearchData) => ({
  type: UPDATE_HINTING,
  payload: { deducedTypes, errors, patchSearchData },
});
