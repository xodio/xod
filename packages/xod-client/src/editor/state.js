import { EDITOR_MODE } from './constants';
import { DEFAULT_PANNING_OFFSET } from '../project/nodeLayout';

export default {
  currentPatchPath: '@/1',
  mode: EDITOR_MODE.DEFAULT,
  selection: [],
  linkingPin: null,
  selectedNodeType: null,
  tabs: {
    '@/1': {
      id: '@/1',
      index: 0,
      offset: DEFAULT_PANNING_OFFSET,
    },
  },
};
