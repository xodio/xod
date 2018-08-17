import { INTRODUCTION } from './messages';
import { LOG_TAB_TYPE } from './constants';

export default {
  isVisible: false,
  isRunning: false,
  isOutdated: false,
  [LOG_TAB_TYPE.COMPILER]: {
    log: INTRODUCTION,
    error: '',
  },
  [LOG_TAB_TYPE.UPLOADER]: {
    log: '',
    error: '',
  },
  [LOG_TAB_TYPE.DEBUGGER]: {
    log: '',
    error: '',
  },
  isSkippingNewSerialLogLines: false,
  numberOfSkippedSerialLogLines: 0,
  isCapturingDebuggerProtocolMessages: false,
  currentTab: LOG_TAB_TYPE.COMPILER,
  currentStage: LOG_TAB_TYPE.COMPILER,
  nodeIdsMap: {},
  watchNodeValues: {},
  uploadProgress: null,
};
