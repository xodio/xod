import { FOCUS_AREAS, TAB_TYPES, SIDEBAR_IDS, PANEL_IDS } from './constants';
import { DEFAULT_PANNING_OFFSET } from '../project/nodeLayout';

export default {
  currentTabId: '@/main',
  isHelpboxVisible: false,
  focusedArea: FOCUS_AREAS.WORKAREA,
  draggedPreviewSize: { width: 0, height: 0 },
  suggester: {
    visible: false,
    placePosition: null,
    highlightedPatchPath: null,
  },
  tabs: {
    '@/main': {
      id: '@/main',
      type: TAB_TYPES.PATCH,
      index: 0,
      patchPath: '@/main',
      selection: [],
      linkingPin: null,
      offset: DEFAULT_PANNING_OFFSET,
    },
  },
  patchWorkareaSize: { width: 0, height: 0 },
  libSuggesterVisible: false,
  panels: {
    [PANEL_IDS.PROJECT_BROWSER]: {
      index: 0,
      maximized: true,
      sidebar: SIDEBAR_IDS.LEFT,
      size: 0.5,
    },
    [PANEL_IDS.INSPECTOR]: {
      index: 1,
      maximized: true,
      sidebar: SIDEBAR_IDS.LEFT,
      size: 0.5,
    },
    [PANEL_IDS.HELPBAR]: {
      index: 3,
      maximized: false,
      sidebar: SIDEBAR_IDS.RIGHT,
      size: 0.5,
    },
    [PANEL_IDS.ACCOUNT]: {
      index: 2,
      maximized: false,
      sidebar: SIDEBAR_IDS.RIGHT,
      size: 0.5,
    },
  },
};
