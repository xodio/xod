
import R from 'ramda';
import { UPLOAD } from './actionTypes';
import client from 'xod-client';

export const getUploadProcess = R.pipe(
  client.getProccesses,
  R.values,
  R.filter(proc => proc.type === UPLOAD),
  R.head
);

export default {
  getUploadProcess,
};
