import { createSystemMessage } from './utils';
import { INTRODUCTION } from './messages';

export default {
  isVisible: false,
  isRunning: false,
  log: [],
  uploadLog: [createSystemMessage(INTRODUCTION)],
  nodeIdsMap: {},
  watchNodeValues: {},
  uploadProgress: null,
};
