import R from 'ramda';
import chai from 'chai';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import core from 'xod-core';
import generateReducers from '../src/core/reducer';
import { nodes } from '../src/project/reducer/patch/nodes';
import * as Actions from '../src/project/actions';
import * as PrepareTo from '../src/project/actionPreparations';

function pin(nodeId, pinKey) {
  return { nodeId, pinKey };
}
const mockStore = (state) => createStore(generateReducers(['1']), state, applyMiddleware(thunk));
const getNodeTypes = (state) => core.dereferencedNodeTypes(state);

describe('Project reducer: ', () => {
  const projectShape = {
    project: {
      meta: {},
      patches: {
        1: {
          id: '1',
          nodes: {},
          links: {},
        },
      },
      nodeTypes: {
        'core/test': {
          id: 'core/test',
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
          id: 'core/output',
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
          id: 'core/prop',
          category: 'hardware',
          pins: {
            in: {
              index: 1,
              direction: 'input',
              injected: true,
              key: 'in',
              type: 'number',
            },
          },
        },
      },
      folders: {
        1: {
          id: '1',
          parentId: null,
          name: 'test',
        },
      },
    },
  };

  describe('Create new project', () => {
    let store;
    beforeEach(() => {
      store = mockStore(projectShape);
    });

    it('should create new project meta and just one patch', () => {
      const projectName = 'Test project';
      store.dispatch(Actions.createProject(projectName));

      const projectState = core.getProject(store.getState());

      chai.expect(projectState.meta.name).to.be.equal(projectName);
      chai.expect(projectState.patches).not.to.be.empty();
    });
  });

  describe('Add node', () => {
    let store;
    beforeEach(() => {
      store = mockStore(projectShape);
    });

    it('should add node', () => {
      const patchId = '1';
      const nodeId = store.dispatch(Actions.addNode('core/test', { x: 10, y: 10 }, patchId));

      const expectedNodes = {
        [nodeId]: {
          id: nodeId,
          typeId: 'core/test',
          pins: {},
          position: {
            x: 10,
            y: 10,
          },
          properties: {},
        },
      };

      const projectState = core.getProject(store.getState());
      const patchState = core.getPatchById(patchId, projectState);

      chai.expect(patchState.nodes).to.deep.equal(expectedNodes);
    });

    it('should be undoable and redoable', () => {
      const patchId = '1';
      const getPatch = core.getPatchById(patchId);

      const initialProjectState = core.getProject(store.getState());
      const initialPatchState = getPatch(initialProjectState);

      store.dispatch(Actions.addNode('core/test', { x: 10, y: 10 }, patchId));
      const updatedProjectState = core.getProject(store.getState());
      const updatedPatchState = getPatch(updatedProjectState);

      store.dispatch(Actions.undoPatch(patchId));
      const undoedProjectState = core.getProject(store.getState());
      const undoedPatchState = getPatch(undoedProjectState);

      store.dispatch(Actions.redoPatch(patchId));
      const redoedProjectState = core.getProject(store.getState());
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
          id: '1',
        }
      ),
      R.assocPath(
        R.append('nodes', patchPath),
        {
          1: {
            id: '1',
            typeId: 'core/test',
          },
          2: {
            id: '2',
            typeId: 'core/test',
          },
        }
      ),
      R.assocPath(
        R.append('links', patchPath),
        {
          1: {
            id: '1',
            pins: [pin('1', 'out'), pin('3', 'in')],
          },
        }
      )
    )(projectShape);

    let store;
    beforeEach(() => {
      store = mockStore(mockState);
    });

    it('should delete node, children pins and link', () => {
      const patchId = '1';
      const expectedNodes = { 2: { id: '2', typeId: 'core/test' } };
      const expectedLinks = {};

      store.dispatch(Actions.deleteNode('1'));

      const projectState = core.getProject(store.getState());
      const patchState = core.getPatchById(patchId, projectState);

      chai.expect(patchState.nodes).to.deep.equal(expectedNodes);
      chai.expect(patchState.links).to.deep.equal(expectedLinks);
    });

    it('should be undoable and redoable', () => {
      const patchId = '1';
      const initialProjectState = core.getProject(store.getState());
      const initialPatchState = core.getPatchById(initialProjectState, patchId);

      store.dispatch(Actions.deleteNode('1'));
      const updatedProjectState = core.getProject(store.getState());
      const updatedPatchState = core.getPatchById(updatedProjectState, patchId);

      store.dispatch(Actions.undoPatch(patchId));
      const undoedProjectState = core.getProject(store.getState());
      const undoedPatchState = core.getPatchById(undoedProjectState, patchId);

      store.dispatch(Actions.redoPatch(patchId));
      const redoedProjectState = core.getProject(store.getState());
      const redoedPatchState = core.getPatchById(redoedProjectState, patchId);

      chai.expect(undoedPatchState).to.deep.equal(initialPatchState);
      chai.expect(redoedPatchState).to.deep.equal(updatedPatchState);
    });
  });

  describe('Moving node', () => {
    const nodeStore = {
      1: {
        id: '1',
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
    const nullPin = { value: null };
    const testPins = { in: nullPin, out: nullPin };
    const nullPos = { x: 0, y: 0 };
    const mockState = R.pipe(
      R.assocPath(
        R.append('links', patchPath),
        {
          1: {
            id: '1',
            pins: [{ nodeId: '1', pinKey: 'out' }, { nodeId: '2', pinKey: 'in' }],
          },
        }
      ),
      R.assocPath(
        R.append('nodes', patchPath),
        {
          1: { id: '1', typeId: 'test/test', position: nullPos, pins: testPins },
          2: { id: '2', typeId: 'test/test', position: nullPos, pins: testPins },
          3: { id: '3', typeId: 'test/test', position: nullPos, pins: testPins },
        }
      ),
      R.assocPath(
        ['project', 'nodeTypes'],
        {
          'test/test': {
            id: 'test/test',
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
      const from = { nodeId: '2', pinKey: 'out' };
      const to = { nodeId: '3', pinKey: 'in' };

      const patchId = '1';
      const newId = store.dispatch(Actions.addLink(from, to));
      const after = store.getState();
      const newLink = R.view(
        R.lensPath(['project', 'patches', patchId, 'present', 'links', newId])
      )(after);
      chai.assert(newId === newLink.id);
    });

    it('should be reverse operation for link deletion', () => {
      const from = { nodeId: '2', pinKey: 'out' };
      const to = { nodeId: '3', pinKey: 'in' };

      const initialState = store.getState();
      const initialPatch = initialState.project.patches[1].present;
      const newLinkId = store.dispatch(Actions.addLink(from, to));
      store.dispatch(Actions.deleteLink(newLinkId));
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
            id: '1',
            pins: [{ nodeId: '1', pinKey: 'out' }, { nodeId: '2', pinKey: 'in' }],
          },
        }
      )
    )(projectShape);
    let store;

    beforeEach(() => {
      store = mockStore(mockState);
    });

    it('should remove link', () => {
      const lastLinkId = '1';
      store.dispatch(Actions.deleteLink(lastLinkId));
      const afterDeleteState = store.getState();
      const afterDeletePatch = afterDeleteState.project.patches[1].present;

      chai.expect(afterDeletePatch.links).to.deep.equal({});
    });

    it('should be undoable and redoable', () => {
      const patchId = '1';
      const lastLinkId = '1';

      const initialProjectState = core.getProject(store.getState());
      const initialPatchState = core.getPatchById(initialProjectState, patchId);

      store.dispatch(Actions.deleteLink(lastLinkId));
      const updatedProjectState = core.getProject(store.getState());
      const updatedPatchState = core.getPatchById(updatedProjectState, patchId);

      store.dispatch(Actions.undoPatch(patchId));
      const undoedProjectState = core.getProject(store.getState());
      const undoedPatchState = core.getPatchById(undoedProjectState, patchId);

      store.dispatch(Actions.redoPatch(patchId));
      const redoedProjectState = core.getProject(store.getState());
      const redoedPatchState = core.getPatchById(redoedProjectState, patchId);

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
            id: '1',
          },
        },
        links: {},
        patches: {},
        meta: {},
        nodeTypes: {},
      };

      store.dispatch(Actions.loadProjectFromJSON(JSON.stringify(data)));
      const projectState = core.getProject(store.getState());
      chai.expect(projectState).to.deep.equal(data);
    });
  });

  describe('Folders reducer', () => {
    let store;
    beforeEach(() => {
      store = mockStore(projectShape);
    });

    it('should add folder without parentId', () => {
      const newFolderId = store.dispatch(Actions.addFolder('Test folder'));
      const folders = core.getFolders(store.getState());

      chai.expect(R.keys(folders)).to.have.lengthOf(2);
      chai.expect(folders[newFolderId].parentId).to.be.equal(null);
    });

    it('should add folder with correct parentId', () => {
      const parentFolderId = '1';
      const newFolderId = store.dispatch(Actions.addFolder('Test folder', parentFolderId));
      const folders = core.getFolders(store.getState());

      chai.expect(R.keys(folders)).to.have.lengthOf(2);
      chai.expect(folders[newFolderId].parentId).to.be.equal(folders[parentFolderId].id);
    });

    it('should delete folder', () => {
      store.dispatch(Actions.deleteFolder('1'));
      const folders = core.getFolders(store.getState());

      chai.expect(R.keys(folders)).to.have.lengthOf(0);
    });

    it('should move folder under another', () => {
      const parentFolderId = '1';
      const childFolderId = store.dispatch(Actions.addFolder('parent', parentFolderId));
      store.dispatch(Actions.moveFolder({ id: childFolderId, parentId: null }));
      const folders = core.getFolders(store.getState());

      chai.expect(folders[childFolderId].parentId).to.be.equal(null);
    });

    it('should rename folder', () => {
      const newFolderName = 'qwe123';
      const lastFolderId = '1';
      store.dispatch(Actions.renameFolder(lastFolderId, newFolderName));
      const folders = core.getFolders(store.getState());

      chai.expect(folders[lastFolderId].name).to.be.equal(newFolderName);
    });
  });

  describe('Patch reducer', () => {
    const mockState = projectShape;
    let store;
    beforeEach(() => {
      store = mockStore(mockState);
    });

    const getPatch = R.prop('static');

    it('should add patch without parentId', () => {
      const newPatchId = store.dispatch(Actions.addPatch('Test patch'));
      const patches = core.getPatches(store.getState());

      chai.expect(R.keys(patches)).to.have.lengthOf(2);
      chai.expect(getPatch(patches[newPatchId]).folderId).to.be.equal(null);
    });

    it('should add patch with correct folderId', () => {
      const parentFolderId = '1';
      const childPatchId = store.dispatch(Actions.addPatch('Test patch', parentFolderId));
      const folders = core.getFolders(store.getState());
      const patches = core.getPatches(store.getState());

      chai.expect(R.keys(patches)).to.have.lengthOf(2);
      chai.expect(getPatch(patches[childPatchId]).folderId).to.be.equal(folders[parentFolderId].id);
    });

    it('should delete patch', () => {
      const lastPatchId = '1';
      store.dispatch(Actions.deletePatch(lastPatchId));
      const patches = core.getPatches(store.getState());

      chai.expect(R.keys(patches)).to.have.lengthOf(0);
    });

    it('should move patch under another folder', () => {
      const lastPatchId = '1';
      const rootFolderId = '1';
      const parentFolderId = store.dispatch(Actions.addFolder('parent', rootFolderId));
      store.dispatch(Actions.movePatch({ id: lastPatchId, folderId: parentFolderId }));
      const patches = core.getPatches(store.getState());

      chai.expect(getPatch(patches[lastPatchId]).folderId).to.be.equal(parentFolderId);
    });

    it('should rename patch', () => {
      const newName = 'qwe123';
      const lastPatchId = '1';
      store.dispatch(Actions.renamePatch(lastPatchId, newName));
      const patches = core.getPatches(store.getState());

      chai.expect(getPatch(patches[lastPatchId]).label).to.be.equal(newName);
    });
  });

  describe('Patch nodes', () => {
    const patchId = '1';
    const mockState = R.clone(
      projectShape
    );

    let store;
    beforeEach(() => {
      store = mockStore(mockState);
    });

    it('should be created by adding IO node into patch', () => {
      const expectedNodeTypes = R.prepend(
        patchId,
        R.keys(getNodeTypes(store.getState()))
      );


      store.dispatch(Actions.addNode('core/output', { x: 10, y: 10 }, patchId));
      chai.expect(R.keys(getNodeTypes(store.getState()))).to.deep.equal(expectedNodeTypes);
    });

    it('should be deleted by deleting last IO node from patch', () => {
      const expectedNodeTypes = getNodeTypes(store.getState());

      const newId = store.dispatch(Actions.addNode('core/output', { x: 10, y: 10 }, patchId));
      store.dispatch(Actions.deleteNode(newId));

      chai.expect(getNodeTypes(store.getState())).to.deep.equal(expectedNodeTypes);
    });

    it('should show error on attempt to delete IO node that have a link', () => {
      const expectedNodeTypeToDelete = {
        id: null,
        error: core.NODETYPE_ERRORS.CANT_DELETE_USED_PIN_OF_PATCHNODE,
      };

      const testNodeId = store.dispatch(Actions.addNode('core/test', { x: 10, y: 10 }, patchId));
      store.dispatch(Actions.addNode('core/output', { x: 10, y: 10 }, patchId));
      const outNodeId = store.dispatch(Actions.addNode('core/output', { x: 10, y: 10 }, patchId));
      const ioNodeId = store.dispatch(Actions.addNode(patchId, { x: 10, y: 10 }, patchId));
      store.dispatch(Actions.addLink(pin(testNodeId, 'in'), pin(ioNodeId, outNodeId)));

      const nodeTypesWithPatch = getNodeTypes(store.getState());
      store.dispatch(Actions.deleteNode(outNodeId));

      const nodeTypesAfterDelete = getNodeTypes(store.getState());
      const nodeTypeToDelete = core.getNodeTypeToDeleteWithNode(
        store.getState().project,
        outNodeId,
        patchId
      );

      chai.expect(nodeTypesWithPatch).to.deep.equal(nodeTypesAfterDelete);
      chai.expect(nodeTypeToDelete).to.deep.equal(expectedNodeTypeToDelete);
    });

    it('should show error on attempt to delete last IO node of used patch node', () => {
      const expectedNodeTypeToDelete = {
        id: patchId,
        error: core.NODETYPE_ERRORS.CANT_DELETE_USED_PATCHNODE,
      };

      store.dispatch(Actions.addNode('core/test', { x: 10, y: 10 }, patchId));
      const outNodeId = store.dispatch(Actions.addNode('core/output', { x: 10, y: 10 }, patchId));
      store.dispatch(Actions.addNode(patchId, { x: 10, y: 10 }, patchId));

      const nodeTypesWithPatch = getNodeTypes(store.getState());

      store.dispatch(Actions.deleteNode(outNodeId));

      const nodeTypesAfterDelete = getNodeTypes(store.getState());
      const nodeTypeToDelete = core.getNodeTypeToDeleteWithNode(
        store.getState().project,
        outNodeId,
        patchId
      );

      chai.expect(nodeTypesWithPatch).to.deep.equal(nodeTypesAfterDelete);
      chai.expect(nodeTypeToDelete).to.deep.equal(expectedNodeTypeToDelete);
    });
  });

  describe('Switching pins/props', () => {
    const patchId = '1';
    const mockState = R.clone(
      projectShape
    );

    let store;
    let testNodes = [];
    beforeEach(() => {
      store = mockStore(mockState);
      testNodes = [];
      testNodes.push(
        store.dispatch(Actions.addNode('core/test', { x: 10, y: 10 }, patchId)),
        store.dispatch(Actions.addNode('core/test', { x: 10, y: 10 }, patchId))
      );
      store.dispatch(Actions.addLink(pin(testNodes[0], 'out'), pin(testNodes[1], 'in')));
    });

    it('should add injected flag to pin', () => {
      const nodeId = testNodes[0];
      const pinKey = 'in';
      const injected = true;

      store.dispatch(Actions.changePinMode(nodeId, pinKey, injected));

      const projectState = core.getProject(store.getState());
      const node = core.getNodes(patchId, projectState)[nodeId];
      const pinData = node.pins[pinKey];

      chai.assert(pinData.injected === injected);
    });

    it('should remove injected flag from pin', () => {
      const nodeId = testNodes[0];
      const pinKey = 'in';
      const injected = false;

      store.dispatch(Actions.changePinMode(nodeId, pinKey, injected));

      const projectState = core.getProject(store.getState());
      const node = core.getNodes(patchId, projectState)[nodeId];
      const pinData = node.pins[pinKey];

      chai.assert(pinData.injected === injected);
    });

    it('should add link between pins that is not injected', () => {
      const projectState = core.getProject(store.getState());
      const links = core.getLinks(projectState, patchId);
      const linksArr = R.values(links);

      chai.assert(linksArr.length === 1);
    });

    it('should show error on attempt to make link between injected pin and regular pin', () => {
      const newNodeId = store.dispatch(Actions.addNode('core/prop', { x: 10, y: 10 }, patchId));

      const validity = core.validatePin(store.getState(), pin(newNodeId, 'in'));

      chai.assert(validity === core.LINK_ERRORS.PROP_CANT_HAVE_LINKS);
    });

    it('should show error on attempt to switch mode of a pin, that has a connected link', () => {
      const projectState = core.getProject(store.getState());
      const preparedData = PrepareTo.changePinMode(
        projectState,
        testNodes[1],
        'in',
        'property'
      );

      chai.expect(preparedData).to.deep.equal({
        error: core.PROPERTY_ERRORS.PIN_HAS_LINK,
      });
    });
  });
});
