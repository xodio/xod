import R from 'ramda';
import client from 'xod-client';

import { UPLOAD } from './actionTypes';

// =============================================================================
//
// Selectors that relate to upload process
//
// =============================================================================

export const getUploadProcess = R.pipe(
  client.getProccesses,
  R.values,
  R.filter(proc => proc.type === UPLOAD),
  R.head
);

// =============================================================================
//
// Upload reducer specific selectors
//
// =============================================================================

export const getUploadState = R.prop('upload');

export const getSelectedSerialPort = R.compose(
  R.prop('selectedSerialPort'),
  getUploadState
);

export default {
  getUploadProcess,
};
