import R from 'ramda';
import chai from 'chai';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import generateReducers from '../src/app-browser/reducer';
import { nodes } from '../src/project/reducer/nodes';
import * as Actions from '../src/project/actions';
import { PROPERTY_ERRORS, LINK_ERRORS, NODETYPE_ERRORS } from '../src/project/constants';
import * as Selectors from '../src/project/selectors';

function pin(nodeId, pinKey) {
  return { nodeId, pinKey };
}
const mockStore = (state) => createStore(generateReducers([1]), state, applyMiddleware(thunk));
const getNodeTypes = (state) => Selectors.dereferencedNodeTypes(state);
const getPatchName = (pId, state) => state.project.patches[pId].present.name;
const getPatchNodeName = (pId, state) =>
  `${Selectors.getUserName()}/${getPatchName(pId, state)}`;

describe('Project reducer: ', () => {
  const projectShape = {
    project: {
      meta: {},
      patches: {
        1: {
          id: 1,
          nodes: {},
          links: {},
        },
      },
      nodeTypes: {
        'core/test': {
          key: 'core/test',
          category: 'hardware',
          pins: {
            in: {
              index: 0,
              direction: 'input',
              key: 'in',
              type: 'number',
            },
            out: {
              index: 1,
              direction: 'output',
              key: 'out',
              type: 'number',
            },
          },
        },
        'core/output': {
          key: 'core/output',
          category: 'io',
          pins: {
            out: {
              index: 1,
              direction: 'input',
              key: 'out',
              type: 'number',
            },
          },
        },
        'core/prop': {
          key: 'core/prop',
          category: 'hardware',
          pins: {
            in: {
              index: 1,
              direction: 'input',
              mode: 'prop',
              key: 'in',
              type: 'number',
            },
          },
        },
      },
      folders: {
        1: {
          id: 1,
          parentId: null,
          name: 'test',
        },
      },
      counter: {
        patches: 1,
        nodes: 0,
        pins: 0,
        links: 0,
        folders: 1,
      },
    },
  };

  describe('Add node', () => {
    let store;
    beforeEach(() => {
      store = mockStore(projectShape);
    });

    it('should add node', () => {
      const patchId = 1;
      const expectedNodes = {
        1: {
          id: 1,
          typeId: 'core/test',
          position: {
            x: 10,
            y: 10,
          },
          pins: {
            in: {
              mode: 'pin',
              value: null,
            },
            out: {
              mode: 'pin',
              value: null,
            },
          },
          properties: {},
        },
      };
      store.dispatch(Actions.addNode('core/test', { x: 10, y: 10 }, patchId));

      const projectState = Selectors.getProject(store.getState());
      const patchState = Selectors.getPatchById(patchId, projectState);

      chai.expect(patchState.nodes).to.deep.equal(expectedNodes);
    });

    it('should be undoable and redoable', () => {
      const patchId = 1;
      const getPatch = Selectors.getPatchById(patchId);

      const initialProjectState = Selectors.getProject(store.getState());
      const initialPatchState = getPatch(initialProjectState);

      store.dispatch(Actions.addNode('core/test', { x: 10, y: 10 }, patchId));
      const updatedProjectState = Selectors.getProject(store.getState());
      const updatedPatchState = getPatch(updatedProjectState);

      store.dispatch(Actions.undoPatch(patchId));
      const undoedProjectState = Selectors.getProject(store.getState());
      const undoedPatchState = getPatch(undoedProjectState);

      store.dispatch(Actions.redoPatch(patchId));
      const redoedProjectState = Selectors.getProject(store.getState());
      const redoedPatchState = getPatch(redoedProjectState);

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
            typeId: 'core/test',
          },
          2: {
            id: 2,
            typeId: 'core/test',
          },
        }
      ),
      R.assocPath(
        R.append('links', patchPath),
        {
          1: {
            id: 1,
            pins: [pin(1, 'out'), pin(3, 'in')],
          },
        }
      ),
      R.assocPath(
        ['project', 'counter'],
        {
          nodes: 2,
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
      const expectedNodes = { 2: { id: 2, typeId: 'core/test' } };
      const expectedLinks = {};

      store.dispatch(Actions.deleteNode(1));

      const projectState = Selectors.getProject(store.getState());
      const patchState = Selectors.getPatchById(patchId, projectState);

      chai.expect(patchState.nodes).to.deep.equal(expectedNodes);
      chai.expect(patchState.links).to.deep.equal(expectedLinks);
    });

    it('should be undoable and redoable', () => {
      const patchId = 1;
      const initialProjectState = Selectors.getProject(store.getState());
      const initialPatchState = Selectors.getPatchById(initialProjectState, patchId);

      store.dispatch(Actions.deleteNode(1));
      const updatedProjectState = Selectors.getProject(store.getState());
      const updatedPatchState = Selectors.getPatchById(updatedProjectState, patchId);

      store.dispatch(Actions.undoPatch(patchId));
      const undoedProjectState = Selectors.getProject(store.getState());
      const undoedPatchState = Selectors.getPatchById(undoedProjectState, patchId);

      store.dispatch(Actions.redoPatch(patchId));
      const redoedProjectState = Selectors.getProject(store.getState());
      const redoedPatchState = Selectors.getPatchById(redoedProjectState, patchId);

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
    const nullPin = { mode: 'pin', value: null };
    const testPins = { in: nullPin, out: nullPin };
    const nullPos = { x: 0, y: 0 };
    const mockState = R.pipe(
      R.assocPath(
        R.append('links', patchPath),
        {
          1: {
            id: 1,
            pins: [{ nodeId: 1, pinKey: 'out' }, { nodeId: 2, pinKey: 'in' }],
          },
        }
      ),
      R.assocPath(
        R.append('nodes', patchPath),
        {
          1: { id: 1, typeId: 'test/test', position: nullPos, pins: testPins },
          2: { id: 2, typeId: 'test/test', position: nullPos, pins: testPins },
          3: { id: 3, typeId: 'test/test', position: nullPos, pins: testPins },
        }
      ),
      R.assocPath(
        ['project', 'counter'],
        {
          patches: 1,
          nodes: 2,
          links: 1,
        }
      ),
      R.assocPath(
        ['project', 'nodeTypes'],
        {
          'test/test': {
            key: 'test/test',
            pins: {
              in: {
                key: 'in',
                direction: 'input',
              },
              out: {
                key: 'out',
                direction: 'output',
              },
            },
          },
        }
      )
    )(projectShape);
    let store;

    beforeEach(() => {
      store = mockStore(mockState);
    });

    it('should insert link', () => {
      const from = { nodeId: 2, pinKey: 'out' };
      const to = { nodeId: 3, pinKey: 'in' };

      const patchId = 1;
      const before = store.getState();
      store.dispatch(Actions.addLink(from, to));
      const after = store.getState();
      const newId = (before.project.counter.links + 1);
      const newLink = R.view(
        R.lensPath(['project', 'patches', patchId, 'present', 'links', newId])
      )(after);
      chai.assert(newId === newLink.id);
    });

    it('should be reverse operation for link deletion', () => {
      const from = { nodeId: 2, pinKey: 'out' };
      const to = { nodeId: 3, pinKey: 'in' };

      const initialState = store.getState();
      const initialPatch = initialState.project.patches[1].present;
      store.dispatch(Actions.addLink(from, to));
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
            pins: [{ nodeId: 1, pinKey: 'out' }, { nodeId: 2, pinKey: 'in' }],
          },
        }
      ),
      R.assocPath(
        ['project', 'counter'],
        {
          patches: 1,
          nodes: 0,
          links: 1,
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

      const initialProjectState = Selectors.getProject(store.getState());
      const initialPatchState = Selectors.getPatchById(initialProjectState, patchId);

      store.dispatch(Actions.deleteLink(lastLinkId));
      const updatedProjectState = Selectors.getProject(store.getState());
      const updatedPatchState = Selectors.getPatchById(updatedProjectState, patchId);

      store.dispatch(Actions.undoPatch(patchId));
      const undoedProjectState = Selectors.getProject(store.getState());
      const undoedPatchState = Selectors.getPatchById(undoedProjectState, patchId);

      store.dispatch(Actions.redoPatch(patchId));
      const redoedProjectState = Selectors.getProject(store.getState());
      const redoedPatchState = Selectors.getPatchById(redoedProjectState, patchId);

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
        links: {},
        patches: {},
        meta: {},
        nodeTypes: {},
      };

      store.dispatch(Actions.loadProjectFromJSON(JSON.stringify(data)));
      const projectState = Selectors.getProject(store.getState());
      chai.expect(projectState).to.deep.equal(data);
    });
  });

  describe('Folders reducer', () => {
    let store;
    beforeEach(() => {
      store = mockStore(projectShape);
    });

    it('should add folder without parentId', () => {
      store.dispatch(Actions.addFolder('Test folder'));
      const childFolderId = Selectors.getLastFolderId(store.getState());
      const folders = Selectors.getFolders(store.getState());

      chai.expect(R.keys(folders)).to.have.lengthOf(2);
      chai.expect(folders[childFolderId].parentId).to.be.equal(null);
    });

    it('should add folder with correct parentId', () => {
      const lastFolderId = Selectors.getLastFolderId(store.getState());
      store.dispatch(Actions.addFolder('Test folder', lastFolderId));
      const childFolderId = Selectors.getLastFolderId(store.getState());
      const folders = Selectors.getFolders(store.getState());

      chai.expect(R.keys(folders)).to.have.lengthOf(2);
      chai.expect(folders[childFolderId].parentId).to.be.equal(folders[lastFolderId].id);
    });

    it('should delete folder', () => {
      const lastFolderId = Selectors.getLastFolderId(store.getState());
      store.dispatch(Actions.deleteFolder(lastFolderId));
      const folders = Selectors.getFolders(store.getState());

      chai.expect(R.keys(folders)).to.have.lengthOf(0);
    });

    it('should move folder under another', () => {
      const parentFolderId = Selectors.getLastFolderId(store.getState());
      store.dispatch(Actions.addFolder('parent', parentFolderId));
      const childFolderId = Selectors.getLastFolderId(store.getState());
      store.dispatch(Actions.moveFolder({ id: childFolderId, parentId: null }));
      const folders = Selectors.getFolders(store.getState());

      chai.expect(folders[childFolderId].parentId).to.be.equal(null);
    });

    it('should rename folder', () => {
      const newFolderName = 'qwe123';
      const lastFolderId = Selectors.getLastFolderId(store.getState());
      store.dispatch(Actions.renameFolder(lastFolderId, newFolderName));
      const folders = Selectors.getFolders(store.getState());

      chai.expect(folders[lastFolderId].name).to.be.equal(newFolderName);
    });
  });

  describe('Patch reducer', () => {
    const mockState = projectShape;
    let store;
    beforeEach(() => {
      store = mockStore(mockState);
    });

    const getPatch = R.prop('present');

    it('should add patch without parentId', () => {
      store.dispatch(Actions.addPatch('Test patch'));
      const childPatchId = Selectors.getLastPatchId(store.getState());
      const patches = Selectors.getPatches(store.getState());

      chai.expect(R.keys(patches)).to.have.lengthOf(2);
      chai.expect(getPatch(patches[childPatchId]).folderId).to.be.equal(null);
    });

    it('should add patch with correct folderId', () => {
      const lastFolderId = Selectors.getLastFolderId(store.getState());
      store.dispatch(Actions.addPatch('Test patch', lastFolderId));
      const childPatchId = Selectors.getLastPatchId(store.getState());
      const folders = Selectors.getFolders(store.getState());
      const patches = Selectors.getPatches(store.getState());

      chai.expect(R.keys(patches)).to.have.lengthOf(2);
      chai.expect(getPatch(patches[childPatchId]).folderId).to.be.equal(folders[lastFolderId].id);
    });

    it('should delete patch', () => {
      const lastPatchId = Selectors.getLastPatchId(store.getState());
      store.dispatch(Actions.deletePatch(lastPatchId));
      const patches = Selectors.getPatches(store.getState());

      chai.expect(R.keys(patches)).to.have.lengthOf(0);
    });

    it('should move patch under another folder', () => {
      const lastPatchId = Selectors.getLastPatchId(store.getState());
      const rootFolderId = Selectors.getLastFolderId(store.getState());
      store.dispatch(Actions.addFolder('parent', rootFolderId));
      const parentFolderId = Selectors.getLastFolderId(store.getState());
      store.dispatch(Actions.movePatch({ id: lastPatchId, folderId: parentFolderId }));
      const patches = Selectors.getPatches(store.getState());

      chai.expect(getPatch(patches[lastPatchId]).folderId).to.be.equal(parentFolderId);
    });

    it('should rename patch', () => {
      const newName = 'qwe123';
      const lastPatchId = Selectors.getLastPatchId(store.getState());
      store.dispatch(Actions.renamePatch(lastPatchId, newName));
      const patches = Selectors.getPatches(store.getState());

      chai.expect(getPatch(patches[lastPatchId]).name).to.be.equal(newName);
    });
  });

  describe('Patch nodes', () => {
    const patchId = 1;
    const mockState = R.clone(
      projectShape
    );

    let store;
    beforeEach(() => {
      store = mockStore(mockState);
    });

    it('should be created by adding IO node into patch', () => {
      const patchNodeName = getPatchNodeName(patchId, store.getState());

      const expectedNodeTypes = R.concat(
        R.keys(getNodeTypes(store.getState())),
        patchNodeName
      );


      store.dispatch(Actions.addNode('core/output', { x: 10, y: 10 }, patchId));
      chai.expect(R.keys(getNodeTypes(store.getState()))).to.deep.equal(expectedNodeTypes);
    });

    it('should be deleted by deleting last IO node from patch', () => {
      const expectedNodeTypes = getNodeTypes(store.getState());

      store.dispatch(Actions.addNode('core/output', { x: 10, y: 10 }, patchId));
      store.dispatch(Actions.deleteNode(1, patchId));

      chai.expect(getNodeTypes(store.getState())).to.deep.equal(expectedNodeTypes);
    });

    it('should show error on attempt to delete IO node that have a link', () => {
      const expectedNodeTypeToDelete = {
        key: null,
        error: NODETYPE_ERRORS.CANT_DELETE_USED_PIN_OF_PATCHNODE,
      };
      const patchNodeName = getPatchNodeName(patchId, store.getState());

      store.dispatch(Actions.addNode('core/test', { x: 10, y: 10 }, patchId));
      store.dispatch(Actions.addNode('core/output', { x: 10, y: 10 }, patchId));
      store.dispatch(Actions.addNode('core/output', { x: 10, y: 10 }, patchId));
      store.dispatch(Actions.addNode(patchNodeName, { x: 10, y: 10 }, patchId));
      store.dispatch(Actions.addLink(pin(1, 'in'), pin(4, 'input_3')));

      const nodeTypesWithPatch = getNodeTypes(store.getState());
      store.dispatch(Actions.deleteNode(3));

      const nodeTypesAfterDelete = getNodeTypes(store.getState());
      const nodeTypeToDelete = Selectors.getNodeTypeToDeleteWithNode(
        store.getState().project,
        3,
        patchId
      );

      chai.expect(nodeTypesWithPatch).to.deep.equal(nodeTypesAfterDelete);
      chai.expect(nodeTypeToDelete).to.deep.equal(expectedNodeTypeToDelete);
    });

    it('should show error on attempt to delete last IO node of used patch node', () => {
      const patchNodeName = getPatchNodeName(patchId, store.getState());
      const expectedNodeTypeToDelete = {
        key: patchNodeName,
        error: NODETYPE_ERRORS.CANT_DELETE_USED_PATCHNODE,
      };

      store.dispatch(Actions.addNode('core/test', { x: 10, y: 10 }, patchId));
      store.dispatch(Actions.addNode('core/output', { x: 10, y: 10 }, patchId));
      store.dispatch(Actions.addNode(patchNodeName, { x: 10, y: 10 }, patchId));

      const nodeTypesWithPatch = getNodeTypes(store.getState());

      store.dispatch(Actions.deleteNode(2));

      const nodeTypesAfterDelete = getNodeTypes(store.getState());
      const nodeTypeToDelete = Selectors.getNodeTypeToDeleteWithNode(
        store.getState().project,
        2,
        patchId
      );

      chai.expect(nodeTypesWithPatch).to.deep.equal(nodeTypesAfterDelete);
      chai.expect(nodeTypeToDelete).to.deep.equal(expectedNodeTypeToDelete);
    });
  });

  describe('Switching pins/props', () => {
    const patchId = 1;
    const mockState = R.clone(
      projectShape
    );

    let store;
    beforeEach(() => {
      store = mockStore(mockState);
      store.dispatch(Actions.addNode('core/test', { x: 10, y: 10 }, patchId));
      store.dispatch(Actions.addNode('core/test', { x: 10, y: 10 }, patchId));
      store.dispatch(Actions.addLink(pin(1, 'out'), pin(2, 'in')));
    });

    it('should add link between pins that has mode "pin"', () => {
      const projectState = Selectors.getProject(store.getState());
      const links = Selectors.getLinks(projectState, patchId);
      const linksArr = R.values(links);

      chai.assert(linksArr.length === 1);
    });

    it('should show error on attempt to make link between pin with mode prop and real pin', () => {
      store.dispatch(Actions.addNode('core/prop', { x: 10, y: 10 }, patchId)); // id: 3

      const validity = Selectors.validatePin(store.getState(), pin(3, 'in'));

      chai.assert(validity === LINK_ERRORS.PROP_CANT_HAVE_LINKS);
    });

    it('should show error on attempt to switch mode of pin, that has a connected link', () => {
      const projectState = Selectors.getProject(store.getState());
      const preparedData = Selectors.prepareToChangePinMode(
        projectState,
        2,
        'in',
        'property'
      );

      chai.expect(preparedData).to.deep.equal({
        error: PROPERTY_ERRORS.PIN_HAS_LINK,
      });
    });
  });
});
