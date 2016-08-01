import R from 'ramda';
import chai from 'chai';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import generateReducers from '../../app/reducers/';
import { nodes } from '../../app/reducers/nodes';
import * as Actions from '../../app/actions';
import Selectors from '../../app/selectors';
import * as PIN_DIRECTION from '../../app/constants/pinDirection';

const mockStore = (state) => createStore(generateReducers([1]), state, applyMiddleware(thunk));

describe('Project reducer: ', () => {
  const projectShape = {
    project: {
      meta: {},
      patches: {
        1: {
          present: {
            nodes: {},
            pins: {},
            links: {},
          },
        },
      },
      nodeTypes: {},
      counter: {
        patches: 1,
        nodes: 0,
        pins: 0,
        links: 0,
      },
    },
  };

  describe('Add node', () => {
    const mockState = R.assocPath(
      ['project', 'nodeTypes', 1],
      {
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
      projectShape
    );

    let store;
    beforeEach(() => {
      store = mockStore(mockState);
    });

    it('should add node and children pins', () => {
      const patchId = 1;
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
      store.dispatch(Actions.addNode(1, { x: 10, y: 10 }, patchId));

      const projectState = Selectors.Project.getProject(store.getState());
      const patchState = Selectors.Project.getPatchById(projectState, patchId);

      chai.expect(patchState.nodes).to.deep.equal(expectedNodes);
      chai.expect(patchState.pins).to.deep.equal(expectedPins);
    });

    it('should be undoable and redoable', () => {
      const patchId = 1;
      const initialProjectState = Selectors.Project.getProject(store.getState());
      const initialPatchState = Selectors.Project.getPatchById(initialProjectState, patchId);

      store.dispatch(Actions.addNode(1, { x: 10, y: 10 }, patchId));
      const updatedProjectState = Selectors.Project.getProject(store.getState());
      const updatedPatchState = Selectors.Project.getPatchById(updatedProjectState, patchId);

      store.dispatch(Actions.undoPatch(patchId));
      const undoedProjectState = Selectors.Project.getProject(store.getState());
      const undoedPatchState = Selectors.Project.getPatchById(undoedProjectState, patchId);

      store.dispatch(Actions.redoPatch(patchId));
      const redoedProjectState = Selectors.Project.getProject(store.getState());
      const redoedPatchState = Selectors.Project.getPatchById(redoedProjectState, patchId);

      chai.expect(undoedPatchState).to.deep.equal(initialPatchState);
      chai.expect(redoedPatchState).to.deep.equal(updatedPatchState);
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

  describe('Load data from JSON', () => {
    let store;
    beforeEach(() => {
      store = mockStore({});
    });

    it('should be loaded', () => {
      const data = {
        nodes: {
          1: {
            id: 1,
          },
        },
        pins: {
          1: {
            id: 1,
            nodeId: 1,
          },
        },
        links: {},
        patches: {},
        meta: {},
        nodeTypes: {},
      };

      store.dispatch(Actions.loadProjectFromJSON(JSON.stringify(data)));
      const projectState = Selectors.Project.getProject(store.getState());
      chai.expect(projectState).to.deep.equal(data);
    });
  });
});
