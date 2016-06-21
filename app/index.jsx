/* eslint-env browser */

import React from 'react';
import ReactDOM from 'react-dom';
import App from './containers/App';

const initialState = {
  project: {
    name: 'Awesome project',
    patches: {
      1: {
        id: 1,
        name: 'My first patch',
        nodes: {
          1: {
            id: 1,
            typeId: 4,
            position: {
              x: 240,
              y: 110
            },
            props: {
              brightness: 0.67
            }
          },
          2: {
            id: 2,
            typeId: 1,
            position: {
              x: 360,
              y: 300
            },
          },
          3: {
            id: 3,
            typeId: 3,
            position: {
              x: 80,
              y: 20
            },
          },
          4: {
            id: 4,
            typeId: 2,
            position: {
              x: 170,
              y: 380
            },
          },
          8: {
            id: 8,
            typeId: 5,
            position: {
              x: 30,
              y: 185
            },
          }
        },
        pins: {
          1: {
            id: 1,
            nodeId: 1,
            type: 'input',
            key: 'in'
          },
          2: {
            id: 2,
            nodeId: 2,
            type: 'input',
            key: 'in'
          },
          3: {
            id: 3,
            nodeId: 2,
            type: 'output',
            key: 'out'
          },
          4: {
            id: 4,
            nodeId: 3,
            type: 'output',
            key: 'out'
          },
          5: {
            id: 5,
            nodeId: 4,
            type: 'input',
            key: 'in'
          },
          6: {
            id: 6,
            nodeId: 8,
            type: 'input',
            key: 'in'
          }
        },
        links: {
          1: {
            id: 1,
            fromPinId: 4,
            toPinId: 1
          },
          2: {
            id: 2,
            fromPinId: 4,
            toPinId: 6
          }
        }
      }
    }
  },
  editor: {
    currentPatch: 1
  },
  nodeTypes: {
    1: {
      id: 1,
      name: 'not',
      category: 'functional',
      pins: {
        input: [{
          key: 'in',
          label: 'in'
        }],
        output: [{
          key: 'out',
          label: 'out'
        }]
      }
    },
    2: {
      id: 2,
      name: 'either',
      category: 'functional',
      pins: {
        input: [{
          key: 'in1',
          label: 'in1'
        }, {
          key: 'in2',
          label: 'in2'
        }],
        output: [{
          key: 'out',
          label: 'out'
        }]
      }
    },
    3: {
      id: 3,
      name: 'pot',
      category: 'hardware',
      pins: {
        input: [],
        output: [{
          key: 'out',
          label: 'out'
        }]
      }
    },
    4: {
      id: 4,
      name: 'led',
      category: 'watch',
      pins: {
        input: [{
          key: 'in',
          label: 'in'
        }],
        output: []
      }
    },
    5: {
      id: 5,
      name: 'servo',
      category: 'hardware',
      pins: {
        input: [],
        output: [{
          key: 'out',
          label: 'out'
        }]
      }
    },
    6: {
      id: 6,
      name: 'config',
      category: 'configuration',
      pins: {
        input: [],
        output: [{
          key: 'out',
          label: 'out'
        }]
      }
    }
  }
};

ReactDOM.render(<App {...initialState} />, document.getElementById('root'));
