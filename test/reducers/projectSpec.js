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
          id: 1,
          nodes: {},
          pins: {},
          links: {},
        },
      },
      nodeTypes: {},
      folders: {},
      counter: {
        patches: 1,
        nodes: 0,
        pins: 0,
        links: 0,
        folders: 0,
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
    const patchPath = ['project', 'patches', 1];
    const mockState = R.pipe(
      R.assocPath(
        patchPath,
        {
          id: 1,
        }
      ),
      R.assocPath(
        R.append('nodes', patchPath),
        {
          1: {
            id: 1,
          },
          2: {
            id: 2,
          },
        }
      ),
      R.assocPath(
        R.append('pins', patchPath),
        {
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
        }
      ),
      R.assocPath(
        R.append('links', patchPath),
        {
          1: {
            id: 1,
            pins: [2, 3],
          },
        }
      ),
      R.assocPath(
        ['project', 'counter'],
        {
          nodes: 2,
          pins: 3,
          links: 1,
        }
      )
    )(projectShape);

    let store;
    beforeEach(() => {
      store = mockStore(mockState);
    });

    it('should delete node, children pins and link', () => {
      const patchId = 1;
      const expectedNodes = { 2: { id: 2 } };
      const expectedPins = { 3: { id: 3, nodeId: 2 } };
      const expectedLinks = {};

      store.dispatch(Actions.deleteNode(1));

      const projectState = Selectors.Project.getProject(store.getState());
      const patchState = Selectors.Project.getPatchById(projectState, patchId);

      chai.expect(patchState.nodes).to.deep.equal(expectedNodes);
      chai.expect(patchState.pins).to.deep.equal(expectedPins);
      chai.expect(patchState.links).to.deep.equal(expectedLinks);
    });

    it('should be undoable and redoable', () => {
      const patchId = 1;
      const initialProjectState = Selectors.Project.getProject(store.getState());
      const initialPatchState = Selectors.Project.getPatchById(initialProjectState, patchId);

      store.dispatch(Actions.deleteNode(1));
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

  describe('Moving node', () => {
    const nodeStore = {
      1: {
        id: 1,
        position: {
          x: 0,
          y: 100,
        },
      },
    };

    it('should move node', () => {
      const nodeId = 1;
      const position = {
        x: 0,
        y: 100,
      };
      const state = nodes(nodeStore, Actions.moveNode(nodeId, position));
      const movedNode = state[nodeId];

      chai.expect(movedNode.position).to.deep.equal(position);
    });
  });

  describe('Add link', () => {
    const patchPath = ['project', 'patches', 1];
    const mockState = R.pipe(
      R.assocPath(
        R.append('links', patchPath),
        {
          1: {
            id: 1,
            pins: [1, 2],
          },
        }
      ),
      R.assocPath(
        R.append('pins', patchPath),
        {
          1: { id: 1 },
          2: { id: 2 },
          3: { id: 3 },
        }
      ),
      R.assocPath(
        ['project', 'counter'],
        {
          patches: 1,
          nodes: 0,
          links: 1,
          pins: 3,
        }
      )
    )(projectShape);
    let store;

    beforeEach(() => {
      store = mockStore(mockState);
    });

    it('should insert link', () => {
      const patchId = 1;
      const before = store.getState();
      store.dispatch(Actions.addLink([2, 3]));
      const after = store.getState();
      const newId = (before.project.counter.links + 1);
      const newLink = R.view(
        R.lensPath(['project', 'patches', patchId, 'present', 'links', newId])
      )(after);
      chai.assert(newId === newLink.id);
    });

    it('should be reverse operation for link deletion', () => {
      const initialState = store.getState();
      const initialPatch = initialState.project.patches[1].present;
      store.dispatch(Actions.addLink([2, 3]));
      const afterAddState = store.getState();
      store.dispatch(Actions.deleteLink(afterAddState.project.counter.links));
      const afterDeleteState = store.getState();
      const afterDeletePatch = afterDeleteState.project.patches[1].present;
      chai.expect(afterDeletePatch).to.deep.equal(initialPatch);
    });
  });

  describe('Delete link', () => {
    const patchPath = ['project', 'patches', 1];
    const mockState = R.pipe(
      R.assocPath(
        R.append('links', patchPath),
        {
          1: {
            id: 1,
            pins: [1, 2],
          },
        }
      ),
      R.assocPath(
        R.append('pins', patchPath),
        {
          1: { id: 1 },
          2: { id: 2 },
          3: { id: 3 },
        }
      ),
      R.assocPath(
        ['project', 'counter'],
        {
          patches: 1,
          nodes: 0,
          links: 1,
          pins: 3,
        }
      )
    )(projectShape);
    let store;

    beforeEach(() => {
      store = mockStore(mockState);
    });

    it('should remove link', () => {
      const lastLinkId = store.getState().project.counter.links;
      store.dispatch(Actions.deleteLink(lastLinkId));
      const afterDeleteState = store.getState();
      const afterDeletePatch = afterDeleteState.project.patches[1].present;

      chai.expect(afterDeletePatch.links).to.deep.equal({});
    });

    it('should be undoable and redoable', () => {
      const patchId = 1;
      const lastLinkId = store.getState().project.counter.links;

      const initialProjectState = Selectors.Project.getProject(store.getState());
      const initialPatchState = Selectors.Project.getPatchById(initialProjectState, patchId);

      store.dispatch(Actions.deleteLink(lastLinkId));
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

  describe('Folders reducer', () => {
    const mockState = R.pipe(
      R.assocPath(
        ['project', 'folders'],
        {
          1: {
            id: 1,
            parentId: null,
            name: 'test',
          },
        }
      ),
      R.assocPath(
        ['project', 'counter', 'folders'],
        1
      )
    )(projectShape);

    let store;
    beforeEach(() => {
      store = mockStore(mockState);
    });

    it('should add folder without parentId', () => {
      store.dispatch(Actions.addFolder('Test folder'));
      const childFolderId = Selectors.Project.getLastFolderId(store.getState());
      const folders = Selectors.Project.getFolders(store.getState());

      chai.expect(R.keys(folders)).to.have.lengthOf(2);
      chai.expect(folders[childFolderId].parentId).to.be.equal(null);
    });

    it('should add folder with correct parentId', () => {
      const lastFolderId = Selectors.Project.getLastFolderId(store.getState());
      store.dispatch(Actions.addFolder('Test folder', lastFolderId));
      const childFolderId = Selectors.Project.getLastFolderId(store.getState());
      const folders = Selectors.Project.getFolders(store.getState());

      chai.expect(R.keys(folders)).to.have.lengthOf(2);
      chai.expect(folders[childFolderId].parentId).to.be.equal(folders[lastFolderId].id);
    });

    it('should delete folder', () => {
      const lastFolderId = Selectors.Project.getLastFolderId(store.getState());
      store.dispatch(Actions.deleteFolder(lastFolderId));
      const folders = Selectors.Project.getFolders(store.getState());

      chai.expect(R.keys(folders)).to.have.lengthOf(0);
    });

    it('should move folder under another', () => {
      const parentFolderId = Selectors.Project.getLastFolderId(store.getState());
      store.dispatch(Actions.addFolder('parent', parentFolderId));
      const childFolderId = Selectors.Project.getLastFolderId(store.getState());
      store.dispatch(Actions.moveFolder({ id: childFolderId, parentId: null }));
      const folders = Selectors.Project.getFolders(store.getState());

      chai.expect(folders[childFolderId].parentId).to.be.equal(null);
    });

    it('should rename folder', () => {
      const newFolderName = 'qwe123';
      const lastFolderId = Selectors.Project.getLastFolderId(store.getState());
      store.dispatch(Actions.renameFolder(lastFolderId, newFolderName));
      const folders = Selectors.Project.getFolders(store.getState());

      chai.expect(folders[lastFolderId].name).to.be.equal(newFolderName);
    });
  });
});
