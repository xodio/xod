import { FOCUS_AREAS, TAB_TYPES } from './constants';
import { DEFAULT_PANNING_OFFSET } from '../project/nodeLayout';

export default {
  currentTabId: '@/1',
  selection: [],
  linkingPin: null,
  isHelpbarVisible: false,
  focusedArea: FOCUS_AREAS.WORKAREA,
  draggedPreviewSize: { width: 0, height: 0 },
  suggester: {
    visible: false,
    placePosition: null,
    highlightedPatchPath: null,
  },
  tabs: {
    '@/1': {
      id: '@/1',
      patchPath: '@/1',
      type: TAB_TYPES.PATCH,
      index: 0,
      offset: DEFAULT_PANNING_OFFSET,
    },
  },
};
