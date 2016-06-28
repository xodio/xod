export const EDITOR_MODE_EDIT = 'edit';
export const EDITOR_MODE_LINKING = 'linking';
export const EDITOR_MODE_PANNING = 'pan';

export const NODETYPE_CATEGORY_FUNCTIONAL = 1;
export const NODETYPE_CATEGORY_HARDWARE = 2;
export const NODETYPE_CATEGORY_CONFIGURATION = 3;
export const NODETYPE_CATEGORY_WATCH = 4;
export const NODETYPE_CATEGORY_PATCHES = 5;

const initialState = {
  project: {
    meta: {
      name: 'Awesome project',
      author: 'Amperka team',
    },
    patches: {
      1: {
        id: 1,
        name: 'Skynet',
      },
    },
    nodes: {
      1: {
        id: 1,
        typeId: 4,
        patchId: 1,
        position: {
          x: 240,
          y: 110,
        },
        props: {
          brightness: 0.67,
        },
      },
      2: {
        id: 2,
        typeId: 1,
        patchId: 1,
        position: {
          x: 360,
          y: 300,
        },
      },
      3: {
        id: 3,
        typeId: 3,
        patchId: 1,
        position: {
          x: 80,
          y: 20,
        },
      },
      4: {
        id: 4,
        typeId: 2,
        patchId: 1,
        position: {
          x: 170,
          y: 380,
        },
      },
      5: {
        id: 5,
        typeId: 5,
        patchId: 1,
        position: {
          x: 30,
          y: 185,
        },
      },
    },
    pins: {
      1: {
        id: 1,
        nodeId: 1,
        type: 'input',
        name: 'in',
      },
      2: {
        id: 2,
        nodeId: 2,
        type: 'input',
        name: 'in',
      },
      3: {
        id: 3,
        nodeId: 2,
        type: 'output',
        name: 'out',
      },
      4: {
        id: 4,
        nodeId: 3,
        type: 'output',
        name: 'out',
      },
      5: {
        id: 5,
        nodeId: 4,
        type: 'input',
        name: 'in',
      },
      6: {
        id: 6,
        nodeId: 5,
        type: 'input',
        name: 'in',
      },
    },
    links: {
      1: {
        id: 1,
        fromPinId: 4,
        toPinId: 1,
      },
      2: {
        id: 2,
        fromPinId: 4,
        toPinId: 6,
      },
    },
  },
  editor: {
    currentPatchId: 1,
    mode: EDITOR_MODE_EDIT,
    selection: [],
    selectedPin: null,
  },
  nodeTypes: {
    1: {
      id: 1,
      name: 'not',
      category: NODETYPE_CATEGORY_FUNCTIONAL,
      pins: {
        input: [{
          key: 'in',
          label: 'in',
        }],
        output: [{
          key: 'out',
          label: 'out',
        }],
      },
    },
    2: {
      id: 2,
      name: 'either',
      category: NODETYPE_CATEGORY_FUNCTIONAL,
      pins: {
        input: [{
          key: 'in1',
          label: 'in1',
        }, {
          key: 'in2',
          label: 'in2',
        }],
        output: [{
          key: 'out',
          label: 'out',
        }],
      },
    },
    3: {
      id: 3,
      name: 'pot',
      category: NODETYPE_CATEGORY_HARDWARE,
      pins: {
        input: [],
        output: [{
          key: 'out',
          label: 'out',
        }],
      },
    },
    4: {
      id: 4,
      name: 'led',
      category: NODETYPE_CATEGORY_WATCH,
      pins: {
        input: [{
          key: 'in',
          label: 'in',
        }],
        output: [],
      },
    },
    5: {
      id: 5,
      name: 'servo',
      category: NODETYPE_CATEGORY_HARDWARE,
      pins: {
        input: [],
        output: [{
          key: 'out',
          label: 'out',
        }],
      },
    },
    6: {
      id: 6,
      name: 'config',
      category: NODETYPE_CATEGORY_CONFIGURATION,
      pins: {
        input: [],
        output: [{
          key: 'out',
          label: 'out',
        }],
      },
    },
  },
};

export default initialState;
