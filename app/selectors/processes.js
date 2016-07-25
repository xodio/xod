import R from 'ramda';
import { UPLOAD } from '../actionTypes';

export const getProccesses = R.prop('processes');

export const getLastId = R.pipe(
  R.keys,
  R.reduce(R.max, 0)
);

export const getNewId = R.pipe(
  getLastId,
  R.inc
);

export const getUpload = R.pipe(
  getProccesses,
  R.values,
  R.filter((proc) => proc.type === UPLOAD),
  R.head
);
