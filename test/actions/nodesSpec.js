import chai from 'chai';
import thunk from 'redux-thunk';
import { nodes } from '../../app/reducers/nodes';
import { pins } from '../../app/reducers/pins';
import { links } from '../../app/reducers/links';
import { nodeTypes } from '../../app/reducers/nodetypes';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import * as Actions from '../../app/actions';

// const middlewares = [thunk];
// const mockStore = configureStore(middlewares);
const mockStore = (state) => createStore(combineReducers({
  project: combineReducers({
    nodes,
    pins,
    links,
  }),
  nodeTypes,
}), state, applyMiddleware(thunk));

describe('Node deleting with dependecies', () => {
  const mockState = {
    project: {
      nodes: {
        1: {
          id: 1,
        },
        2: {
          id: 2,
        },
      },
      pins: {
        1: {
          id: 1,
          nodeId: 1,
        },
        2: {
          id: 2,
          nodeId: 1,
        },
        3: {
          id: 3,
          nodeId: 2,
        },
      },
      links: {
        1: {
          id: 1,
          fromPinId: 2,
          toPinId: 3,
        },
      },
    },
  };

  let store;
  beforeEach(() => {
    store = mockStore(mockState);
  });

  it('should delete node, children pins and link', () => {
    const expectedState = {
      project: {
        nodes: {
          2: { id: 2 },
        },
        pins: {
          3: { id: 3, nodeId: 2 },
        },
        links: {},
      },
      nodeTypes: {},
    };

    store.dispatch(Actions.deleteNodeWithDependencies(1));

    chai.expect(store.getState()).to.deep.equal(expectedState);
  });
});

describe('Node add with dependencies', () => {
  const mockState = {
    project: {
      nodes: {},
      pins: {},
    },
    nodeTypes: {
      1: {
        id: 1,
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
    },
  };

  let store;
  beforeEach(() => {
    store = mockStore(mockState);
  });
  it('should add children pins', () => {
    const expectedState = {
      project: {
        nodes: {
          0: {
            id: 0,
            typeId: 1,
            position: {
              x: 10,
              y: 10,
            },
          },
        },
        pins: {
          0: {
            id: 0,
            nodeId: 0,
            type: 'input',
            name: 'in',
          },
          1: {
            id: 1,
            nodeId: 0,
            type: 'output',
            name: 'out',
          },
        },
        links: {},
      },
      nodeTypes: {
        1: {
          id: 1,
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
      },
    };

    store.dispatch(Actions.addNodeWithDependencies(1, { x: 10, y: 10 }));

    chai.expect(store.getState()).to.deep.equal(expectedState);
  });
});
