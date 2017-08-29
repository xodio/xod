import { EDITOR_MODE, FOCUS_AREAS } from './constants';
import { DEFAULT_PANNING_OFFSET } from '../project/nodeLayout';

export default {
  currentPatchPath: '@/1',
  mode: EDITOR_MODE.DEFAULT,
  selection: [],
  linkingPin: null,
  selectedNodeType: null,
  isHelpbarVisible: false,
  focusedArea: FOCUS_AREAS.WORKAREA,
  tabs: {
    '@/1': {
      id: '@/1',
      index: 0,
      offset: DEFAULT_PANNING_OFFSET,
    },
  },
};
