import R from 'ramda';
import { UPLOAD } from './actionTypes';
import { STATUS } from 'xod-client/utils/constants';

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

export const findProcessByPath = path => R.pipe(
  R.values,
  R.find(R.propEq('path', path))
);

export const findProcessByType = type => R.pipe(
  R.values,
  R.find(R.propEq('type', type))
);

export const filterNotFinished = R.filter(
  R.anyPass([
    R.propEq('status', STATUS.STARTED),
    R.propEq('status', STATUS.PROGRESSED),
  ])
);
