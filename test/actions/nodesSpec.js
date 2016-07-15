import chai from 'chai';
import thunk from 'redux-thunk';
import { nodes } from '../../app/reducers/nodes';
import { pins } from '../../app/reducers/pins';
import { links } from '../../app/reducers/links';
import { nodeTypes } from '../../app/reducers/nodetypes';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import * as Actions from '../../app/actions';
import * as PIN_DIRECTION from '../../app/constants/pinDirection';

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

describe('Node actions with dependencies', () => {
  describe('Add node', () => {
    const mockState = {
      project: {
        nodes: {},
        pins: {},
      },
      nodeTypes: {
        1: {
          id: 1,
          pins: {
            in: {
              key: 'in',
              type: PIN_DIRECTION.INPUT,
              label: 'in',
            },
            out: {
              key: 'out',
              type: PIN_DIRECTION.OUTPUT,
              label: 'out',
            },
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
              properties: {},
            },
          },
          pins: {
            0: {
              id: 0,
              nodeId: 0,
              key: 'in',
            },
            1: {
              id: 1,
              nodeId: 0,
              key: 'out',
            },
          },
          links: {},
        },
        nodeTypes: {
          1: {
            id: 1,
            pins: {
              in: {
                key: 'in',
                type: PIN_DIRECTION.INPUT,
                label: 'in',
              },
              out: {
                key: 'out',
                type: PIN_DIRECTION.OUTPUT,
                label: 'out',
              },
            },
          },
        },
      };

      store.dispatch(Actions.addNodeWithDependencies(1, { x: 10, y: 10 }));

      chai.expect(store.getState()).to.deep.equal(expectedState);
    });
  });

  describe('Delete node', () => {
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
});
