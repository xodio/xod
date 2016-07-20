import chai from 'chai';
import { createStore, combineReducers } from 'redux';
import undoable, { ActionCreators as ReduxUndoActions } from 'redux-undo';
import projectReducer from '../../app/reducers/project';
import { newId, lastId, nodes } from '../../app/reducers/nodes';
import * as Actions from '../../app/actions';
import Selectors from '../../app/selectors';
import * as PIN_DIRECTION from '../../app/constants/pinDirection';

const mockStore = (state) => createStore(combineReducers({
  project: undoable(projectReducer),
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
        links: {},
        meta: {},
        patches: {},
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

      const projectStore = Selectors.Project.getProject(store.getState());

      chai.expect(projectStore.nodes).to.deep.equal(expectedNodes);
      chai.expect(projectStore.pins).to.deep.equal(expectedPins);
    });

    it('should set appropriate id for a new node', () => {
      store.dispatch(Actions.addNode(1, { x: 10, y: 10 }));
      const projectStore = Selectors.Project.getProject(store.getState());

      chai.assert(
        lastId(projectStore.nodes) === newId(mockState.project.nodes)
      );
    });

    it('should be undoable and redoable', () => {
      store.dispatch(Actions.addNode(1, { x: 10, y: 10 }));
      const updatedStore = Selectors.Project.getProject(store.getState());
      store.dispatch(ReduxUndoActions.undo());
      const undoedStore = Selectors.Project.getProject(store.getState());
      store.dispatch(ReduxUndoActions.redo());
      const redoedStore = Selectors.Project.getProject(store.getState());
      chai.expect(undoedStore).to.deep.equal(mockState.project);
      chai.expect(redoedStore).to.deep.equal(updatedStore);
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
        nodeTypes: {},
        meta: {},
        patches: {},
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

      const projectStore = Selectors.Project.getProject(store.getState());

      chai.expect(projectStore.nodes).to.deep.equal(expectedNodes);
      chai.expect(projectStore.pins).to.deep.equal(expectedPins);
      chai.expect(projectStore.links).to.deep.equal(expectedLinks);
    });

    it('should be undoable and redoable', () => {
      store.dispatch(Actions.deleteNode(1));
      const updatedStore = Selectors.Project.getProject(store.getState());
      store.dispatch(ReduxUndoActions.undo());
      const undoedStore = Selectors.Project.getProject(store.getState());
      store.dispatch(ReduxUndoActions.redo());
      const redoedStore = Selectors.Project.getProject(store.getState());
      chai.expect(undoedStore).to.deep.equal(mockState.project);
      chai.expect(redoedStore).to.deep.equal(updatedStore);
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
