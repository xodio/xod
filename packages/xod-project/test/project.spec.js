import R from 'ramda';
import { Maybe } from 'ramda-fantasy';
import chai, { expect, assert } from 'chai';
import dirtyChai from 'dirty-chai';

import { addMissingOptionalProjectFields } from '../src/optionalFieldsUtils';
import * as CONST from '../src/constants';
import * as Node from '../src/node';
import * as Pin from '../src/pin';
import * as Patch from '../src/patch';
import * as Project from '../src/project';
import { formatString } from '../src/utils';
import { BUILT_IN_PATCH_PATHS } from '../src/builtInPatches';

import brokenProject from './fixtures/broken-project.json';

import * as Helper from './helpers';

chai.use(dirtyChai);

const emptyProject = Helper.defaultizeProject({});

describe('Project', () => {
  describe('createProject', () => {
    it('should return object', () => {
      expect(Project.createProject()).to.be.an('object');
    });
    it('should have key: authors === []', () => {
      const proj = Project.createProject();
      expect(proj)
        .to.have.property('authors')
        .that.is.an('array')
        .that.have.lengthOf(0);
    });
    it('should have key: description === []', () => {
      const proj = Project.createProject();
      expect(proj)
        .to.have.property('description')
        .that.is.an('string')
        .that.is.empty();
    });
    it('should have key: license === []', () => {
      const proj = Project.createProject();
      expect(proj)
        .to.have.property('license')
        .that.is.an('string')
        .that.is.empty();
    });
    it('should have key: patches === {}', () => {
      const proj = Project.createProject();
      expect(proj)
        .to.have.property('patches')
        .that.is.an('object')
        .that.is.empty();
    });
  });

  describe('setProjectAuthors', () => {
    it('should return Project with authors equal to empty array', () => {
      expect(Project.setProjectAuthors([], emptyProject))
        .to.be.an('object')
        .that.have.property('authors')
        .to.be.instanceof(Array)
        .to.be.empty();
    });
    it('should return Project with assigned array into authors', () => {
      const authors = ['Vasya', 'Petya'];
      expect(Project.setProjectAuthors(authors, emptyProject))
        .to.be.an('object')
        .that.have.property('authors')
        .that.deep.equal(authors);
    });
  });
  describe('getProjectAuthors', () => {
    it('should return empty array even if Project is empty object', () => {
      expect(Project.getProjectAuthors(emptyProject)).to.be.empty();
    });
    it('should return array of authors', () => {
      const project = Helper.defaultizeProject({
        authors: ['Vasya', 'Petya'],
      });
      expect(Project.getProjectAuthors(project)).to.have.members(['Vasya', 'Petya']);
    });
  });

  // entity getters / search functions
  describe('getPatchByPath', () => {
    it('should return Nothing<Null> if project is empty object', () => {
      const maybe = Project.getPatchByPath('does/not/exist', emptyProject);
      expect(maybe.isNothing).to.be.true();
    });
    it('should return Nothing<Null> if there is no patch with such path', () => {
      const project = Helper.defaultizeProject({
        patches: {
          '@/one': {},
        },
      });
      const maybe = Project.getPatchByPath('@/two', project);
      expect(maybe.isNothing).to.be.true();
    });
    it('should return Just<{}> if project have a patch', () => {
      const project = Helper.defaultizeProject({
        patches: {
          '@/one': {},
        },
      });
      const maybe = Project.getPatchByPath('@/one', project);
      expect(maybe.isJust).to.be.true();
    });
  });
  describe('getPatchByPathUnsafe', () => {
    it('should throw error if project is empty object', () => {
      const fn = () => Project.getPatchByPathUnsafe('does/not/exist', emptyProject);
      expect(fn).to.throw(Error, formatString(CONST.ERROR.PATCH_NOT_FOUND_BY_PATH, { patchPath: 'does/not/exist' }));
    });
    it('should throw error if there is no patch with such path', () => {
      const project = Helper.defaultizeProject({
        patches: {
          '@/one': {},
        },
      });
      const fn = () => Project.getPatchByPathUnsafe('@/two', project);
      expect(fn).to.throw(Error, formatString(CONST.ERROR.PATCH_NOT_FOUND_BY_PATH, { patchPath: '@/two' }));
    });
    it('should return Patch if project have a patch', () => {
      const project = Helper.defaultizeProject({
        patches: {
          '@/one': {},
        },
      });
      const patch = Project.getPatchByPathUnsafe('@/one', project);
      expect(patch).to.be.deep.equal(project.patches['@/one']);
    });
  });
  describe('getPatchByNode', () => {
    const project = Helper.defaultizeProject({
      patches: {
        'xod/core/test': {
          nodes: {
            a: { id: 'a', type: 'xod/patch-nodes/input-number', label: 'A' },
          },
        },
      },
    });

    it('should return Nothing for unexisting patch', () => {
      const maybe = Project.getPatchByNode(Helper.defaultizeNode({ type: 'test/unexisting/patch' }), project);
      expect(maybe.isNothing).to.be.true();
    });
    it('should return Just<Patch> for existing patch in the project', () => {
      const maybe = Project.getPatchByNode(Helper.defaultizeNode({ type: 'xod/core/test' }), project);
      expect(maybe.isJust).to.be.true();
      expect(R.unnest(maybe)).to.be.deep.equal(project.patches['xod/core/test']);
    });
  });
  describe('getNodePins', () => {
    const project = Helper.defaultizeProject({
      patches: {
        'xod/core/test': {
          nodes: {
            a: { id: 'a', type: 'xod/patch-nodes/input-number', label: 'A' },
          },
        },
      },
    });

    const expectedPins = [Pin.createPin('a', 'number', 'input', 0, 'A', '', true, 0)];

    it('should return Nothing for unexisting patch', () => {
      const maybe = Project.getNodePins(Helper.defaultizeNode({ type: 'test/unexisting/patch' }), emptyProject);
      expect(maybe.isNothing).to.be.true();
    });
    it('should return Just<Pin[]> for existing pin', () => {
      const maybe = Project.getNodePins(Helper.defaultizeNode({ type: 'xod/core/test' }), project);
      expect(maybe.isJust).to.be.true();
      expect(R.unnest(maybe)).to.be.deep.equal(expectedPins);
    });
  });
  describe('getNodePin', () => {
    const project = Helper.defaultizeProject({
      patches: {
        'xod/core/test': {
          nodes: {
            a: { id: 'a', type: 'xod/patch-nodes/input-number', label: 'A' },
          },
        },
      },
    });

    const expectedPin = Pin.createPin('a', 'number', 'input', 0, 'A', '', true, 0);

    it('should return Nothing for unexisting patch', () => {
      const maybe = Project.getNodePin('test', Helper.defaultizeNode({ type: 'test/unexisting/patch' }), emptyProject);
      expect(maybe.isNothing).to.be.true();
    });
    it('should return Nothing for unexisting pin', () => {
      const maybe = Project.getNodePin('b', Helper.defaultizeNode({ type: 'xod/core/test' }), project);
      expect(maybe.isNothing).to.be.true();
    });
    it('should return Just<Pin> for existing pin', () => {
      const maybe = Project.getNodePin('a', Helper.defaultizeNode({ type: 'xod/core/test' }), project);
      expect(maybe.isJust).to.be.true();
      expect(R.unnest(maybe)).to.be.deep.equal(expectedPin);
    });
  });

  // validations
  describe('validatePatchRebase', () => {
    it('should return Either.Left if we try to rebase a built-in patch', () => {
      const project = Helper.defaultizeProject({
        patches: { '@/test': {}, '@/patch': {} },
      });
      const newProject = Project.validatePatchRebase(
        'my/own/input-boolean',
        'xod/patch-nodes/input-boolean',
        project
      );

      expect(newProject.isLeft).to.be.true();
      Helper.expectErrorMessage(expect, newProject, CONST.ERROR.PATCH_REBASING_BUILT_IN);
    });
    it('should return Either.Left if patch is not in the project', () => {
      const newProject = Project.validatePatchRebase('@/test', '@/patch', emptyProject);

      expect(newProject.isLeft).to.be.true();
      Helper.expectErrorMessage(expect, newProject, formatString(CONST.ERROR.PATCH_NOT_FOUND_BY_PATH, { patchPath: '@/patch' }));
    });
    it('should return Either.Left if another patch with same path already exist', () => {
      const project = Helper.defaultizeProject({
        patches: { '@/test': {}, '@/patch': {} },
      });
      const newProject = Project.validatePatchRebase('@/test', '@/patch', project);

      expect(newProject.isLeft).to.be.true();
      Helper.expectErrorMessage(expect, newProject, CONST.ERROR.PATCH_PATH_OCCUPIED);
    });
    it('should return Either.Right with Project', () => {
      const patch = {};
      const oldPath = '@/test';
      const newPath = '@/anotherPath';
      const project = Helper.defaultizeProject({ patches: { [oldPath]: patch } });

      const newProject = Project.validatePatchRebase(newPath, oldPath, project);
      Helper.expectEither(
        (proj) => {
          expect(proj).to.be.equal(project);
        },
        newProject
      );
    });
  });
  describe('validatePatchContents', () => {
    const smallProject = Helper.defaultizeProject({
      patches: {
        '@/test': {},
      },
    });
    const fullProject = Helper.defaultizeProject({
      patches: {
        '@/test': {
          nodes: {
            in: { id: 'in', type: 'xod/patch-nodes/input-number' },
            out: { id: 'out', type: 'xod/patch-nodes/output-number' },
          },
        },
      },
    });
    const patchWithNodeOnly = Helper.defaultizePatch({
      nodes: {
        a: { id: 'a', type: '@/test' },
      },
    });
    const fullPatch = Helper.defaultizePatch({
      nodes: {
        a: { id: 'a', type: '@/test' },
        b: { id: 'b', type: '@/test' },
      },
      links: {
        l: {
          id: 'l',
          input: { nodeId: 'a', pinKey: 'in' },
          output: { nodeId: 'b', pinKey: 'out' },
        },
      },
    });

    it('should be Either.Left for non-existent type', () => {
      const result = Project.validatePatchContents(patchWithNodeOnly, emptyProject);
      expect(result.isLeft).to.be.true();
      Helper.expectErrorMessage(expect, result, formatString(
        CONST.ERROR.TYPE_NOT_FOUND,
        { type: '@/test' }
      ));
    });
    it('should be Either.Left for non-existent pins', () => {
      const result = Project.validatePatchContents(fullPatch, smallProject);
      expect(result.isLeft).to.be.true();
      Helper.expectErrorMessage(expect, result, CONST.ERROR.PINS_NOT_FOUND);
    });
    it('should be Either.Right for empty patch', () => {
      const newPatch = Helper.defaultizePatch({ path: '@/test2' });
      const result = Project.validatePatchContents(newPatch, smallProject);
      expect(result.isRight).to.be.true();
      Helper.expectEither(
        validPatch => expect(validPatch).to.be.equal(newPatch),
        result
      );
    });
    it('should be Either.Right for patch with valid node without links', () => {
      const result = Project.validatePatchContents(patchWithNodeOnly, smallProject);
      expect(result.isRight).to.be.true();
      Helper.expectEither(
        validPatch => expect(validPatch).to.be.equal(patchWithNodeOnly),
        result
      );
    });
    it('should be Either.Right for valid new patch', () => {
      const result = Project.validatePatchContents(fullPatch, fullProject);
      expect(result.isRight).to.be.true();
      Helper.expectEither(
        validPatch => expect(validPatch).to.be.equal(fullPatch),
        result
      );
    });
  });

  // entity setters
  describe('assocPatch', () => {
    it('should return Either.Left if patch is not valid', () => {
      const invalidPatch = R.pipe(
        Patch.createPatch,
        Patch.assocNode(
          Node.createNode({ x: 0, y: 0 }, 'not/existing/type')
        )
      )();
      const newProject = Project.assocPatch('@/test', invalidPatch, emptyProject);
      expect(newProject.isLeft).to.be.true();
    });
    it('should return Either.Right with associated patch', () => {
      const path = '@/test';
      const patch = Patch.createPatch();
      const newProject = Project.assocPatch(path, patch, emptyProject);
      expect(newProject.isRight).to.be.true();
      Helper.expectEither(
        (proj) => {
          expect(proj)
            .to.have.property('patches')
            .that.have.property(path)
            .that.deep.equals(R.assoc('path', path, patch));
        },
        newProject
      );
    });
    it('should not remove other patches from project', () => {
      const oldPath = '@/old';
      const oldPatch = Helper.defaultizePatch({ path: '@/old' });
      const newPath = '@/new';
      const newPatch = Helper.defaultizePatch({ path: '@/new' });
      const project = Helper.defaultizeProject({
        patches: {
          [oldPath]: oldPatch,
        },
      });
      const newProject = Project.assocPatch(newPath, newPatch, project);
      expect(newProject.isRight).to.be.true();
      Helper.expectEither(
        (proj) => {
          expect(Project.getPatchByPathUnsafe(oldPath, proj)).to.be.deep.equal(oldPatch);
          expect(Project.getPatchByPathUnsafe(newPath, proj)).to.be.deep.equal(newPatch);
        },
        newProject
      );
    });
  });
  describe('assocPatchList', () => {
    const patches = R.map(Helper.defaultizePatch, [
      { path: '@/main' },
      { path: '@/foo' },
      { path: 'xod/test/a' },
    ]);
    it('should return Right Projct with associated patches', () => {
      const res = Project.assocPatchList(patches, emptyProject);
      Helper.expectEither(
        proj => R.forEach(
          (expectedPatch) => {
            const patchPath = Patch.getPatchPath(expectedPatch);
            expect(Project.getPatchByPathUnsafe(patchPath, proj)).to.be.deep.equal(expectedPatch);
          },
          patches
        ),
        res
      );
    });
    it('should return Left Error, cause one of patches is invalid', () => {
      const invalidPatches = R.append(
        Helper.defaultizePatch({ path: '@/wrong', nodes: { a: { type: 'xod/test/not-existent-one' } } }),
        patches
      );
      const res = Project.assocPatchList(invalidPatches, emptyProject);
      Helper.expectErrorMessage(expect, res, formatString(CONST.ERROR.TYPE_NOT_FOUND, { type: 'xod/test/not-existent-one' }));
    });
  });
  describe('dissocPatch', () => {
    it('should dissocPatch by path string', () => {
      const path = '@/test';
      const patch = {};
      const project = Helper.defaultizeProject({ patches: { [path]: patch } });
      const newProject = Project.dissocPatch(path, project);
      expect(newProject)
        .to.have.property('patches')
        .that.empty();
    });
    it('should not affect on other patches', () => {
      const patch = { path: '@/test' };
      const anotherPatch = { path: '@/leave-me-alone' };
      const project = Helper.defaultizeProject({
        patches: {
          [patch.path]: patch,
          [anotherPatch.path]: anotherPatch,
        },
      });
      const newProject = Project.dissocPatch(patch.path, project);
      expect(newProject)
        .to.have.property('patches')
        .that.contain.all.keys([anotherPatch.path]);
    });
    it('should return project even if it has no patches', () => {
      const newProject = Project.dissocPatch('@/test', emptyProject);
      expect(newProject).to.be.deep.equal(emptyProject);
    });
  });
  describe('rebasePatch', () => {
    it('should return Either.Left if something is not valid', () => {
      expect(Project.rebasePatch('@/new', '@/old', emptyProject).isLeft)
        .to.be.true();
    });
    it('should return Either.Right for correct values', () => {
      const oldPath = '@/test';
      const newPath = '@/anotherPath';
      const project = Helper.defaultizeProject({ patches: { [oldPath]: {} } });

      const newProject = Project.rebasePatch(newPath, oldPath, project);
      expect(newProject.isRight).to.be.true();

      Helper.expectEither(
        (proj) => {
          expect(proj)
            .to.have.property('patches')
            .that.have.property(newPath);
          expect(proj.patches).to.have.all.keys(newPath);
        },
        newProject
      );
    });
    it('should update path property of a moved patch', () => {
      const oldPath = '@/test';
      const newPath = '@/anotherPath';
      const project = Helper.defaultizeProject({
        patches: {
          [oldPath]: { path: oldPath },
        },
      });

      const newProject = Project.rebasePatch(newPath, oldPath, project);

      Helper.expectEither(
        (proj) => {
          expect(proj)
            .to.have.property('patches')
            .that.have.property(newPath)
            .that.have.property('path')
            .that.equals(newPath);
        },
        newProject
      );
    });
    it('should update all reference on changed path', () => {
      const oldPath = '@/test';
      const newPath = '@/anotherPath';
      const withNodesPath = '@/withNodes';
      const project = Helper.defaultizeProject({
        patches: {
          [oldPath]: {},
          [withNodesPath]: {
            nodes: { 1: { type: oldPath } },
          },
        },
      });

      const newProject = Project.rebasePatch(newPath, oldPath, project);
      expect(newProject.isRight).to.be.true();

      Helper.expectEither(
        (proj) => {
          expect(proj)
            .to.have.property('patches')
            .that.have.property(withNodesPath)
            .that.have.property('nodes')
            .that.have.property('1')
            .that.have.property('type')
            .that.equal(newPath);

          expect(proj.patches).to.have.all.keys([newPath, withNodesPath]);
        },
        newProject
      );
    });
  });

  // lists
  describe('lists', () => {
    const project = Helper.defaultizeProject({
      patches: {
        '@/test': { path: '@/test' },
        'some/external/patch': { path: 'some/external/patch' },
      },
    });

    describe('listPatches', () => {
      it('should return built-in patches for empty project', () => {
        assert.sameMembers(
          R.values(Project.BUILT_IN_PATCHES),
          Project.listPatches(emptyProject)
        );
      });
      it('should return array with patches', () => {
        expect(Project.listPatches(project))
          .to.be.instanceof(Array)
          .and.have.lengthOf(2 + R.length(BUILT_IN_PATCH_PATHS));
      });
    });
    describe('listPatchesWithoutBuiltIns', () => {
      it('should return empty array for empty project', () => {
        assert.deepEqual(
          [],
          Project.listPatchesWithoutBuiltIns(emptyProject)
        );
      });
      it('should return array with patches for non-empty project', () => {
        expect(Project.listPatchesWithoutBuiltIns(project))
          .to.be.instanceof(Array)
          .and.have.lengthOf(2);
      });
    });
    describe('listPatchPaths', () => {
      it('should return array of built-in patch paths for empty project', () => {
        assert.sameMembers(
          BUILT_IN_PATCH_PATHS,
          Project.listPatchPaths(emptyProject)
        );
      });
      it('should return array with two keys', () => {
        const expected = R.concat(
          ['@/test', 'some/external/patch'],
          BUILT_IN_PATCH_PATHS
        );

        assert.sameMembers(
          expected,
          Project.listPatchPaths(project)
        );
      });
    });
    describe('listLocalPatches', () => {
      it('should return empty array for empty project', () => {
        expect(Project.listLocalPatches(emptyProject))
          .to.be.instanceof(Array)
          .and.to.be.empty();
      });
      it('should return array with one pin', () => {
        expect(Project.listLocalPatches(project))
          .to.be.instanceof(Array)
          .and.have.all.members([project.patches['@/test']]);
      });
    });
    describe('listLibraryPatches', () => {
      it('should return built-in patches for empty project', () => {
        assert.sameMembers(
          R.values(Project.BUILT_IN_PATCHES),
          Project.listLibraryPatches(emptyProject)
        );
      });
      it('should return array with one patch', () => {
        const expected = R.concat(
          [project.patches['some/external/patch']],
          R.values(Project.BUILT_IN_PATCHES)
        );

        assert.sameMembers(
          expected,
          Project.listLibraryPatches(project)
        );
      });
    });
  });

  // etc
  describe('isTerminalNodeInUse', () => {
    const project = Helper.defaultizeProject({
      patches: {
        '@/main': {
          nodes: {
            instanceOfPatchInQuestion: { type: '@/foo' },
            someOtherNode: { type: 'xod/patch-nodes/input-number' },
          },
          links: {
            someLink: {
              input: { nodeId: 'instanceOfPatchInQuestion', pinKey: 'importantTerminal' },
              output: { nodeId: 'someOtherNode', pinKey: '__out__' },
            },
          },
        },
        '@/foo': {
          nodes: {
            importantTerminal: { type: 'xod/patch-nodes/input-number' },
            notImportantTerminal: { type: 'xod/patch-nodes/input-number' },
          },
        },
      },
    });

    it('should return false for unused terminal nodes', () => {
      expect(
        Project.isTerminalNodeInUse('nonImportantTerminal', '@/foo', project)
      ).to.be.false();
    });

    it('should return true for used terminal nodes', () => {
      expect(
        Project.isTerminalNodeInUse('importantTerminal', '@/foo', project)
      ).to.be.true();
    });
  });

  describe('resolveNodeTypesInProject', () => {
    const project = Helper.defaultizeProject({
      patches: {
        '@/main': {
          nodes: {
            o: { type: 'xod/core/b' },
          },
        },
        'xod/core/a': {
          nodes: {
            a: { type: 'xod/patch-nodes/input-number' },
          },
        },
        'xod/core/b': {
          nodes: {
            b: { type: '@/a' },
          },
        },
      },
    });
    const expectedMap = {
      '@/main': { o: 'xod/core/b' },
      'xod/core/a': { a: 'xod/patch-nodes/input-number' },
      'xod/core/b': { b: 'xod/core/a' },
    };
    // :: Project -> Map PatchPath (Map NodeId PatchPath)
    const getActualMap = R.compose(
      R.map(R.compose(
        R.map(Node.getNodeType),
        R.indexBy(Node.getNodeId),
        Patch.listNodes
      )),
      R.indexBy(Patch.getPatchPath),
      Project.listPatchesWithoutBuiltIns
    );

    it('should return the same Project with updated NodeTypes of lib patches', () => {
      const resolved = Project.resolveNodeTypesInProject(project);
      const actMap = getActualMap(resolved);
      expect(actMap).to.be.deep.equal(expectedMap);
    });
  });

  describe('project surviving', () => {
    const project = addMissingOptionalProjectFields(brokenProject);
    const curPatch = Project.getPatchByPathUnsafe('@/main', project);

    // :: NodeId -> Patch -> [PinKey]
    const getPinKeysByNodeId = R.compose(
      Maybe.maybe([], R.identity),
      R.map(R.compose(
        R.keys,
        Project.getPinsForNode(R.__, curPatch, project)
      )),
      Patch.getNodeById
    );

    it('should add broken pins to nodes, that points to unexisting patch', () => {
      const pinKeysOut = getPinKeysByNodeId('brokenNodeOutLinks', curPatch);
      assert.lengthOf(pinKeysOut, 1);
      const pinKeysIn = getPinKeysByNodeId('brokenNodeInLinks', curPatch);
      assert.lengthOf(pinKeysIn, 2);
    });
    it('should add broken pins to valid nodes, that has connected links to unexisting pins', () => {
      const pinKeys = getPinKeysByNodeId('validNodeId', curPatch);
      assert.lengthOf(pinKeys, 5);
    });
  });
});
