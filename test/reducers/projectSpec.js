import chai from 'chai';
import projectReducer from '../../app/reducers/project';
import { createStore, combineReducers } from 'redux';
import { newId, lastId, nodes } from '../../app/reducers/nodes';
import * as Actions from '../../app/actions';
import * as PIN_DIRECTION from '../../app/constants/pinDirection';

const mockStore = (state) => createStore(combineReducers({
  project: projectReducer,
}), state);

describe('Project reducer: ', () => {
  describe('Add node', () => {
    const mockState = {
      project: {
        nodes: {},
        pins: {},
        nodeTypes: {
          1: {
            id: 1,
            pins: {
              in: {
                key: 'in',
                direction: PIN_DIRECTION.INPUT,
              },
              out: {
                key: 'out',
                direction: PIN_DIRECTION.OUTPUT,
              },
            },
          },
        },
      },
    };

    let store;
    beforeEach(() => {
      store = mockStore(mockState);
    });

    it('should add node and children pins', () => {
      const expectedNodes = {
        1: {
          id: 1,
          typeId: 1,
          position: {
            x: 10,
            y: 10,
          },
          properties: {},
        },
      };
      const expectedPins = {
        1: {
          id: 1,
          nodeId: 1,
          key: 'in',
        },
        2: {
          id: 2,
          nodeId: 1,
          key: 'out',
        },
      };

      store.dispatch(Actions.addNode(1, { x: 10, y: 10 }));

      chai.expect(store.getState().project.nodes).to.deep.equal(expectedNodes);
      chai.expect(store.getState().project.pins).to.deep.equal(expectedPins);
    });

    it('should set appropriate id for a new node', () => {
      store.dispatch(Actions.addNode(1, { x: 10, y: 10 }));
      chai.assert(
        lastId(store.getState().project.nodes) === newId(mockState.project.nodes)
      );
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
            pins: [2, 3],
          },
        },
      },
    };

    let store;
    beforeEach(() => {
      store = mockStore(mockState);
    });

    it('should delete node, children pins and link', () => {
      const expectedNodes = {
        2: { id: 2 },
      };
      const expectedPins = {
        3: { id: 3, nodeId: 2 },
      };
      const expectedLinks = {};

      store.dispatch(Actions.deleteNode(1));

      chai.expect(store.getState().project.nodes).to.deep.equal(expectedNodes);
      chai.expect(store.getState().project.pins).to.deep.equal(expectedPins);
      chai.expect(store.getState().project.links).to.deep.equal(expectedLinks);
    });
  });

  describe('Moving node', () => {
    let nodeStore = null;

    beforeEach(() => {
      nodeStore = {
        1: {
          id: 1,
          position: {
            x: 0,
            y: 100,
          },
        },
      };
    });

    it('should move node', () => {
      const oldState = nodeStore;
      const position = {
        x: 0,
        y: 100,
      };
      const state = nodes(oldState, Actions.moveNode(lastId(oldState), position));

      const movedNode = state[lastId(oldState)];

      chai.expect(movedNode.position).to.deep.equal(position);
    });
  });
});
