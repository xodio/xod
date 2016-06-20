/* eslint-env browser */

import React from 'react';
import ReactDOM from 'react-dom';
import App from './containers/App';

const initialState = {
  project: {
    name: 'Awesome project',
    patches: {
      1: {
        nodes: {
          1: {
            id: 1,
            typeId: 4,
            props: {
              brightness: 0.67
            }
          },
          2: {
            id: 2,
            typeId: 1
          },
          3: {
            id: 3,
            typeId: 3
          },
          4: {
            id: 4,
            typeId: 2
          },
          5: {
            id: 5,
            typeId: 5
          }
        },
        pins: {
          1: {
            id: 1,
            nodeId: 1,
            key: 'in'
          },
          2: {
            id: 2,
            nodeId: 2,
            key: 'in'
          },
          3: {
            id: 3,
            nodeId: 2,
            key: 'out'
          },
          4: {
            id: 4,
            nodeId: 3,
            key: 'out'
          },
          5: {
            id: 5,
            nodeId: 4,
            key: 'in'
          },
          6: {
            id: 6,
            nodeId: 5,
            key: 'out'
          }
        },
        links: {
          
        }
      }
    }
  },
  editor: {},
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

ReactDOM.render(<App data={initialState} />, document.getElementById('root'));
