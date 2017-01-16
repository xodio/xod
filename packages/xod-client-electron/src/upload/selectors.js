import R from 'ramda';
import client from 'xod-client';

import { UPLOAD } from './actionTypes';

export const getUploadProcess = R.pipe(
  client.getProccesses,
  R.values,
  R.filter(proc => proc.type === UPLOAD),
  R.head
);

export default {
  getUploadProcess,
};
