import { INTRODUCTION } from './messages';
import { LOG_TAB_TYPE, SESSION_TYPE } from './constants';

export const DEFAULT_TETHERING_INET_STATE = {
  nodeId: null,
  sender: null,
  chunksToSend: [],
  transmitter: () => {},
};

export default {
  activeSession: SESSION_TYPE.NONE,
  isPreparingSimulation: false,
  isOutdated: false,
  [LOG_TAB_TYPE.INSTALLER]: {
    log: '',
    error: '',
  },
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
  [LOG_TAB_TYPE.TESTER]: {
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
  tableLogSources: {
    // PatchPath : [NodeId]
    // where PatchPath is a path of root patch that was compiled
  },
  tableLogValues: {
    // NodeId : [ /* Experiments history */ [[String]] ]
  },
  uploadProgress: null,
  interactiveErroredNodePins: {},
  pinsAffectedByErrorRaisers: {},
  globals: {},
  tetheringInet: DEFAULT_TETHERING_INET_STATE,
};
