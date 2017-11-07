import { FOCUS_AREAS, TAB_TYPES } from './constants';
import { DEFAULT_PANNING_OFFSET } from '../project/nodeLayout';

export default {
  currentTabId: '@/1',
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
      type: TAB_TYPES.PATCH,
      index: 0,
      patchPath: '@/1',
      selection: [],
      linkingPin: null,
      offset: DEFAULT_PANNING_OFFSET,
    },
  },
};
