import R from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';
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
      expect(Project.getProjectAuthors(project)).to.have.members([
        'Vasya',
        'Petya',
      ]);
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
      const fn = () =>
        Project.getPatchByPathUnsafe('does/not/exist', emptyProject);
      expect(fn).to.throw(
        Error,
        formatString(CONST.ERROR.PATCH_NOT_FOUND_BY_PATH, {
          patchPath: 'does/not/exist',
        })
      );
    });
    it('should throw error if there is no patch with such path', () => {
      const project = Helper.defaultizeProject({
        patches: {
          '@/one': {},
        },
      });
      const fn = () => Project.getPatchByPathUnsafe('@/two', project);
      expect(fn).to.throw(
        Error,
        formatString(CONST.ERROR.PATCH_NOT_FOUND_BY_PATH, {
          patchPath: '@/two',
        })
      );
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
      const maybe = Project.getPatchByNode(
        Helper.defaultizeNode({ type: 'test/unexisting/patch' }),
        project
      );
      expect(maybe.isNothing).to.be.true();
    });
    it('should return Just<Patch> for existing patch in the project', () => {
      const maybe = Project.getPatchByNode(
        Helper.defaultizeNode({ type: 'xod/core/test' }),
        project
      );
      expect(maybe.isJust).to.be.true();
      expect(R.unnest(maybe)).to.be.deep.equal(
        project.patches['xod/core/test']
      );
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

    const expectedPins = [
      Pin.createPin('a', 'number', 'input', 0, 'A', '', true, 0),
    ];

    it('should return Nothing for unexisting patch', () => {
      const maybe = Project.getNodePins(
        Helper.defaultizeNode({ type: 'test/unexisting/patch' }),
        emptyProject
      );
      expect(maybe.isNothing).to.be.true();
    });
    it('should return Just<Pin[]> for existing pin', () => {
      const maybe = Project.getNodePins(
        Helper.defaultizeNode({ type: 'xod/core/test' }),
        project
      );
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

    const expectedPin = Pin.createPin(
      'a',
      'number',
      'input',
      0,
      'A',
      '',
      true,
      0
    );

    it('should return Nothing for unexisting patch', () => {
      const maybe = Project.getNodePin(
        'test',
        Helper.defaultizeNode({ type: 'test/unexisting/patch' }),
        emptyProject
      );
      expect(maybe.isNothing).to.be.true();
    });
    it('should return Nothing for unexisting pin', () => {
      const maybe = Project.getNodePin(
        'b',
        Helper.defaultizeNode({ type: 'xod/core/test' }),
        project
      );
      expect(maybe.isNothing).to.be.true();
    });
    it('should return Just<Pin> for existing pin', () => {
      const maybe = Project.getNodePin(
        'a',
        Helper.defaultizeNode({ type: 'xod/core/test' }),
        project
      );
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

      Helper.expectEitherError(CONST.ERROR.PATCH_REBASING_BUILT_IN, newProject);
    });
    it('should return Either.Left if patch is not in the project', () => {
      const newProject = Project.validatePatchRebase(
        '@/test',
        '@/patch',
        emptyProject
      );

      Helper.expectEitherError(
        formatString(CONST.ERROR.PATCH_NOT_FOUND_BY_PATH, {
          patchPath: '@/patch',
        }),
        newProject
      );
    });
    it('should return Either.Left if another patch with same path already exist', () => {
      const project = Helper.defaultizeProject({
        patches: { '@/test': {}, '@/patch': {} },
      });
      const newProject = Project.validatePatchRebase(
        '@/test',
        '@/patch',
        project
      );

      Helper.expectEitherError(CONST.ERROR.PATCH_PATH_OCCUPIED, newProject);
    });
    it('should return Either.Right with Project', () => {
      const patch = {};
      const oldPath = '@/test';
      const newPath = '@/another-path';
      const project = Helper.defaultizeProject({
        patches: { [oldPath]: patch },
      });

      const newProject = Project.validatePatchRebase(newPath, oldPath, project);
      Helper.expectEitherRight(proj => {
        expect(proj).to.be.equal(project);
      }, newProject);
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
      const result = Project.validatePatchContents(
        patchWithNodeOnly,
        emptyProject
      );
      Helper.expectEitherError(
        formatString(CONST.ERROR.TYPE_NOT_FOUND, { type: '@/test' }),
        result
      );
    });
    it('should be Either.Left for non-existent pins', () => {
      const result = Project.validatePatchContents(fullPatch, smallProject);
      Helper.expectEitherError(CONST.ERROR.PINS_NOT_FOUND, result);
    });
    it('should be Either.Right for empty patch', () => {
      const newPatch = Helper.defaultizePatch({ path: '@/test2' });
      const result = Project.validatePatchContents(newPatch, smallProject);
      Helper.expectEitherRight(
        validPatch => expect(validPatch).to.be.equal(newPatch),
        result
      );
    });
    it('should be Either.Right for patch with valid node without links', () => {
      const result = Project.validatePatchContents(
        patchWithNodeOnly,
        smallProject
      );
      Helper.expectEitherRight(
        validPatch => expect(validPatch).to.be.equal(patchWithNodeOnly),
        result
      );
    });
    it('should be Either.Right for valid new patch', () => {
      const result = Project.validatePatchContents(fullPatch, fullProject);
      Helper.expectEitherRight(
        validPatch => expect(validPatch).to.be.equal(fullPatch),
        result
      );
    });
    it('should be Either.Right for valid blink project', () => {
      const blinkProject = Helper.loadXodball('./fixtures/blinking.xodball');
      const mainPatch = Project.getPatchByPathUnsafe('@/main', blinkProject);
      const result = Project.validatePatchContents(mainPatch, blinkProject);
      Helper.expectEitherRight(
        validPatch => expect(validPatch).to.be.equal(mainPatch),
        result
      );
    });
  });
  describe('validateLinkPins', () => {
    const testPatches = {
      numbers: Helper.defaultizePatch({
        path: 'test/nodes/numbers',
        nodes: {
          in: {
            type: 'xod/patch-nodes/input-number',
          },
          out: {
            type: 'xod/patch-nodes/output-number',
          },
        },
      }),
      pulses: Helper.defaultizePatch({
        path: 'test/nodes/pulses',
        nodes: {
          in: {
            type: 'xod/patch-nodes/input-pulse',
          },
          out: {
            type: 'xod/patch-nodes/output-pulse',
          },
        },
      }),
      variadic: Helper.defaultizePatch({
        path: 'test/nodes/variadic',
        nodes: {
          in: {
            type: 'xod/patch-nodes/input-number',
          },
          in2: {
            type: 'xod/patch-nodes/input-number',
          },
          out: {
            type: 'xod/patch-nodes/output-number',
          },
          v: {
            type: 'xod/patch-nodes/variadic-1',
          },
        },
      }),
    };

    it('invalid link if input Node does not exists', () => {
      const link = Helper.defaultizeLink({
        id: 'l',
        input: { nodeId: 'a', pinKey: 'out' },
        output: { nodeId: 'b', pinKey: 'in' },
      });
      const patch = Helper.defaultizePatch({
        path: '@/test',
        nodes: {
          b: {
            type: 'test/nodes/numbers',
          },
        },
        links: {
          l: link,
        },
      });
      const project = Helper.defaultizeProject({
        patches: {
          '@/test': patch,
          'test/nodes/numbers': testPatches.numbers,
        },
      });

      const result = Project.validateLinkPins(link, patch, project);
      Helper.expectEitherError(
        `Can't find the Node "a" in the patch with path "@/test"`,
        result
      );
    });
    it('invalid link if output Node does not exists', () => {
      const link = Helper.defaultizeLink({
        id: 'l',
        input: { nodeId: 'a', pinKey: 'out' },
        output: { nodeId: 'b', pinKey: 'in' },
      });
      const patch = Helper.defaultizePatch({
        path: '@/test',
        nodes: {
          a: {
            type: 'test/nodes/numbers',
          },
        },
        links: {
          l: link,
        },
      });
      const project = Helper.defaultizeProject({
        patches: {
          '@/test': patch,
          'test/nodes/numbers': testPatches.numbers,
        },
      });

      const result = Project.validateLinkPins(link, patch, project);
      Helper.expectEitherError(
        `Can't find the Node "b" in the patch with path "@/test"`,
        result
      );
    });
    it('invalid link if input Pin does not exists', () => {
      const link = Helper.defaultizeLink({
        id: 'l',
        input: { nodeId: 'a', pinKey: 'out2' },
        output: { nodeId: 'b', pinKey: 'in' },
      });
      const patch = Helper.defaultizePatch({
        path: '@/test',
        nodes: {
          a: {
            type: 'test/nodes/numbers',
          },
          b: {
            type: 'test/nodes/numbers',
          },
        },
        links: {
          l: link,
        },
      });
      const project = Helper.defaultizeProject({
        patches: {
          '@/test': patch,
          'test/nodes/numbers': testPatches.numbers,
        },
      });

      const result = Project.validateLinkPins(link, patch, project);
      Helper.expectEitherError(
        "Specified node types haven't required pins for creating links",
        result
      );
    });
    it('invalid link if output Pin does not exists', () => {
      const link = Helper.defaultizeLink({
        id: 'l',
        input: { nodeId: 'a', pinKey: 'out' },
        output: { nodeId: 'b', pinKey: 'in2' },
      });
      const patch = Helper.defaultizePatch({
        path: '@/test',
        nodes: {
          a: {
            type: 'test/nodes/numbers',
          },
          b: {
            type: 'test/nodes/numbers',
          },
        },
        links: {
          l: link,
        },
      });
      const project = Helper.defaultizeProject({
        patches: {
          '@/test': patch,
          'test/nodes/numbers': testPatches.numbers,
        },
      });

      const result = Project.validateLinkPins(link, patch, project);
      Helper.expectEitherError(
        "Specified node types haven't required pins for creating links",
        result
      );
    });
    it('invalid link if Patch for input Node does not exists', () => {
      const link = Helper.defaultizeLink({
        id: 'l',
        input: { nodeId: 'a', pinKey: 'out' },
        output: { nodeId: 'b', pinKey: 'in' },
      });
      const patch = Helper.defaultizePatch({
        path: '@/test',
        nodes: {
          a: {
            type: 'test/nodes/not-exists',
          },
          b: {
            type: 'test/nodes/numbers',
          },
        },
        links: {
          l: link,
        },
      });
      const project = Helper.defaultizeProject({
        patches: {
          '@/test': patch,
          'test/nodes/numbers': testPatches.numbers,
        },
      });

      const result = Project.validateLinkPins(link, patch, project);
      Helper.expectEitherError(
        'Patch with type "test/nodes/not-exists" is not found in the project',
        result
      );
    });
    it('invalid link if Patch for output Node does not exists', () => {
      const link = Helper.defaultizeLink({
        id: 'l',
        input: { nodeId: 'a', pinKey: 'out' },
        output: { nodeId: 'b', pinKey: 'in' },
      });
      const patch = Helper.defaultizePatch({
        path: '@/test',
        nodes: {
          a: {
            type: 'test/nodes/numbers',
          },
          b: {
            type: 'test/nodes/not-exists',
          },
        },
        links: {
          l: link,
        },
      });
      const project = Helper.defaultizeProject({
        patches: {
          '@/test': patch,
          'test/nodes/numbers': testPatches.numbers,
        },
      });

      const result = Project.validateLinkPins(link, patch, project);
      Helper.expectEitherError(
        'Patch with type "test/nodes/not-exists" is not found in the project',
        result
      );
    });
    it('invalid link between incompatible pins', () => {
      const link = Helper.defaultizeLink({
        id: 'l',
        input: { nodeId: 'a', pinKey: 'out' },
        output: { nodeId: 'b', pinKey: 'in' },
      });
      const patch = Helper.defaultizePatch({
        path: '@/test',
        nodes: {
          a: {
            type: 'test/nodes/numbers',
          },
          b: {
            type: 'test/nodes/pulses',
          },
        },
        links: {
          l: link,
        },
      });
      const project = Helper.defaultizeProject({
        patches: {
          '@/test': patch,
          'test/nodes/numbers': testPatches.numbers,
          'test/nodes/pulses': testPatches.pulses,
        },
      });

      const result = Project.validateLinkPins(link, patch, project);
      Helper.expectEitherError(
        '@/test: type pulse can’t cast to number directly.',
        result
      );
    });

    it('valid link between compatible pins', () => {
      const link = Helper.defaultizeLink({
        id: 'l',
        input: { nodeId: 'a', pinKey: 'out' },
        output: { nodeId: 'b', pinKey: 'in' },
      });
      const patch = Helper.defaultizePatch({
        path: '@/test',
        nodes: {
          a: {
            type: 'test/nodes/numbers',
          },
          b: {
            type: 'test/nodes/numbers',
          },
        },
        links: {
          l: link,
        },
      });
      const project = Helper.defaultizeProject({
        patches: {
          '@/test': patch,
          'test/nodes/numbers': testPatches.numbers,
        },
      });

      const result = Project.validateLinkPins(link, patch, project);
      assert.equal(Either.isRight(result), true);
    });
    it('valid link connected to variadic input', () => {
      const link = Helper.defaultizeLink({
        id: 'l',
        input: { nodeId: 'a', pinKey: 'out' },
        output: { nodeId: 'b', pinKey: 'in2-$1' },
      });
      const patch = Helper.defaultizePatch({
        path: '@/test',
        nodes: {
          a: {
            type: 'test/nodes/numbers',
          },
          b: {
            type: 'test/nodes/variadic',
            arityLevel: 2,
          },
        },
        links: {
          l: link,
        },
      });
      const project = Helper.defaultizeProject({
        patches: {
          '@/test': patch,
          'test/nodes/numbers': testPatches.numbers,
          'test/nodes/variadic': testPatches.variadic,
        },
      });

      const result = Project.validateLinkPins(link, patch, project);
      assert.equal(Either.isRight(result), true);
    });
  });

  // entity setters
  describe('assocPatch', () => {
    it('should return Either.Left if patch is not valid', () => {
      const invalidPatch = R.pipe(
        Patch.createPatch,
        Patch.assocNode(Node.createNode({ x: 0, y: 0 }, 'not/existing/type'))
      )();
      const newProject = Project.assocPatch(
        '@/test',
        invalidPatch,
        emptyProject
      );
      expect(newProject.isLeft).to.be.true();
    });
    it('should return Either.Right with associated patch', () => {
      const path = '@/test';
      const patch = Patch.createPatch();
      const newProject = Project.assocPatch(path, patch, emptyProject);
      Helper.expectEitherRight(proj => {
        expect(proj)
          .to.have.property('patches')
          .that.have.property(path)
          .that.deep.equals(R.assoc('path', path, patch));
      }, newProject);
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
      Helper.expectEitherRight(proj => {
        expect(Project.getPatchByPathUnsafe(oldPath, proj)).to.be.deep.equal(
          oldPatch
        );
        expect(Project.getPatchByPathUnsafe(newPath, proj)).to.be.deep.equal(
          newPatch
        );
      }, newProject);
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
      Helper.expectEitherRight(
        proj =>
          R.forEach(expectedPatch => {
            const patchPath = Patch.getPatchPath(expectedPatch);
            expect(
              Project.getPatchByPathUnsafe(patchPath, proj)
            ).to.be.deep.equal(expectedPatch);
          }, patches),
        res
      );
    });
    it('should return Left Error, cause one of patches is invalid', () => {
      const invalidPatches = R.append(
        Helper.defaultizePatch({
          path: '@/wrong',
          nodes: { a: { type: 'xod/test/not-existent-one' } },
        }),
        patches
      );
      const res = Project.assocPatchList(invalidPatches, emptyProject);
      Helper.expectEitherError(
        formatString(CONST.ERROR.TYPE_NOT_FOUND, {
          type: 'xod/test/not-existent-one',
        }),
        res
      );
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
      expect(
        Project.rebasePatch('@/new', '@/old', emptyProject).isLeft
      ).to.be.true();
    });
    it('should return Either.Right for correct values', () => {
      const oldPath = '@/test';
      const newPath = '@/another-path';
      const project = Helper.defaultizeProject({ patches: { [oldPath]: {} } });

      const newProject = Project.rebasePatch(newPath, oldPath, project);

      Helper.expectEitherRight(proj => {
        expect(proj)
          .to.have.property('patches')
          .that.have.property(newPath);
        expect(proj.patches).to.have.all.keys(newPath);
      }, newProject);
    });
    it('should update path property of a moved patch', () => {
      const oldPath = '@/test';
      const newPath = '@/another-path';
      const project = Helper.defaultizeProject({
        patches: {
          [oldPath]: { path: oldPath },
        },
      });

      const newProject = Project.rebasePatch(newPath, oldPath, project);

      Helper.expectEitherRight(proj => {
        expect(proj)
          .to.have.property('patches')
          .that.have.property(newPath)
          .that.have.property('path')
          .that.equals(newPath);
      }, newProject);
    });
    it('should update all reference on changed path', () => {
      const oldPath = '@/test';
      const newPath = '@/another-path';
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

      Helper.expectEitherRight(proj => {
        expect(proj)
          .to.have.property('patches')
          .that.have.property(withNodesPath)
          .that.have.property('nodes')
          .that.have.property('1')
          .that.have.property('type')
          .that.equal(newPath);

        expect(proj.patches).to.have.all.keys([newPath, withNodesPath]);
      }, newProject);
    });
  });

  // lists
  describe('lists', () => {
    const project = Helper.defaultizeProject({
      patches: {
        '@/test': {
          path: '@/test',
          nodes: { a: { type: 'another/one/external' } },
        },
        'some/external/patch': { path: 'some/external/patch' },
        'some/external/patch-2': { path: 'some/external/patch-2' },
        'another/one/external': {
          path: 'another/one/external',
          nodes: {
            a: { type: 'some/external/patch-2' },
            b: { type: 'xod/core/add' },
          },
        },
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
          .and.have.lengthOf(4 + R.length(BUILT_IN_PATCH_PATHS));
      });
    });
    describe('listPatchesWithoutBuiltIns', () => {
      it('should return empty array for empty project', () => {
        assert.deepEqual([], Project.listPatchesWithoutBuiltIns(emptyProject));
      });
      it('should return array with patches for non-empty project', () => {
        expect(Project.listPatchesWithoutBuiltIns(project))
          .to.be.instanceof(Array)
          .and.have.lengthOf(4);
      });
    });
    describe('listPatchPaths', () => {
      it('should return array of built-in patch paths for empty project', () => {
        assert.sameMembers(
          BUILT_IN_PATCH_PATHS,
          Project.listPatchPaths(emptyProject)
        );
      });
      it('should return array with four keys and some built in patch paths', () => {
        const expected = R.concat(
          [
            '@/test',
            'some/external/patch',
            'some/external/patch-2',
            'another/one/external',
          ],
          BUILT_IN_PATCH_PATHS
        );

        assert.sameMembers(expected, Project.listPatchPaths(project));
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
      it('should return array with one library patch and some built in patches', () => {
        const expected = R.concat(
          [
            project.patches['some/external/patch'],
            project.patches['some/external/patch-2'],
            project.patches['another/one/external'],
          ],
          R.values(Project.BUILT_IN_PATCHES)
        );
        assert.sameMembers(expected, Project.listLibraryPatches(project));
      });
    });
    describe('listInstalledLibraryNames', () => {
      it('returns empty array for empty project', () =>
        assert.isEmpty(
          Project.listInstalledLibraryNames(Helper.defaultizeProject({}))
        ));
      it('returns empty array for project without any library', () =>
        assert.isEmpty(
          Project.listInstalledLibraryNames(
            Helper.defaultizeProject({
              patches: {
                '@/main': { path: '@/main' },
                '@/hello': { path: '@/hello' },
              },
            })
          )
        ));
      it('returns array with two libnames', () =>
        assert.sameMembers(Project.listInstalledLibraryNames(project), [
          'some/external',
          'another/one',
        ]));
    });
    describe('listLibraryNamesUsedInProject', () => {
      it('returns empty array for empty project', () =>
        assert.isEmpty(
          Project.listLibraryNamesUsedInProject(Helper.defaultizeProject({}))
        ));
      it('returns empty array for project without any library', () =>
        assert.isEmpty(
          Project.listLibraryNamesUsedInProject(
            Helper.defaultizeProject({
              patches: {
                '@/main': { path: '@/main' },
                '@/hello': { path: '@/hello' },
              },
            })
          )
        ));
      it('returns array with three libnames', () =>
        assert.sameMembers(Project.listLibraryNamesUsedInProject(project), [
          'some/external',
          'another/one',
          'xod/core',
        ]));
    });
    describe('listMissingLibraryNames()', () => {
      it('returns an empty list if there is no missing libraries', () =>
        assert.isEmpty(
          Project.listMissingLibraryNames(
            Helper.defaultizeProject({
              patches: {
                '@/a': { path: '@/a', nodes: { a: { type: '@/b' } } },
                '@/b': { path: '@/b' },
              },
            })
          )
        ));
      it('returns a list of library names', () =>
        assert.sameMembers(
          Project.listMissingLibraryNames(
            Helper.defaultizeProject({
              patches: {
                '@/a': {
                  path: '@/a',
                  nodes: {
                    a: { type: '@/b' },
                    b: { type: 'xod/test/use-units' },
                    c: { type: 'another/one/library' },
                  },
                },
                '@/b': {
                  path: '@/b',
                  nodes: {
                    a: { type: 'xod/patch-nodes/input-number' },
                    b: { type: 'xod/common-hardware/led' },
                  },
                },
                'xod/test/use-units': {
                  path: 'xod/test/use-units',
                  nodes: {
                    a: { type: 'xod/units/c-to-f' },
                  },
                },
                'xod/common-hardware/led': {
                  path: 'xod/common-hardware/led',
                  nodes: {
                    a: { type: 'xod/patch-nodes/input-number' },
                  },
                },
              },
            })
          ),
          ['xod/units', 'another/one']
        ));
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
              input: {
                nodeId: 'instanceOfPatchInQuestion',
                pinKey: 'importantTerminal',
              },
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
      R.map(
        R.compose(
          R.map(Node.getNodeType),
          R.indexBy(Node.getNodeId),
          Patch.listNodes
        )
      ),
      R.indexBy(Patch.getPatchPath),
      Project.listPatchesWithoutBuiltIns
    );

    it('should return the same Project with updated NodeTypes of lib patches', () => {
      const resolved = Project.resolveNodeTypesInProject(project);
      const actMap = getActualMap(resolved);
      expect(actMap).to.be.deep.equal(expectedMap);
    });
  });

  describe('validateProject', () => {
    const brokenProject = Helper.loadXodball(
      './fixtures/broken-project.xodball'
    );
    const project = addMissingOptionalProjectFields(brokenProject);
    const unfoldLeft = e => Either.either(R.identity, R.always(null), e);
    const unfoldRight = e => Either.either(R.always(null), R.identity, e);

    it('returns Either Error about non-existing patch in the project', () => {
      const res = Project.validateProject(project);
      const err = new Error(
        formatString(CONST.ERROR.TYPE_NOT_FOUND, {
          type: '@/not-existing-patch',
        })
      );

      assert.equal(res.isLeft, true);
      assert.strictEqual(unfoldLeft(res).message, err.message);
    });
    it('returns Either Error about missing pins', () => {
      const newPatch = Helper.defaultizePatch({});
      const projectWithNotExistingPatch = Project.assocPatchUnsafe(
        '@/not-existing-patch',
        newPatch,
        project
      );
      const res = Project.validateProject(projectWithNotExistingPatch);
      const err = new Error(CONST.ERROR.PINS_NOT_FOUND);

      assert.equal(res.isLeft, true);
      assert.strictEqual(unfoldLeft(res).message, err.message);
    });
    it('returns Either Project for valid empty project', () => {
      const validProject = Helper.defaultizeProject({});
      const res = Project.validateProject(validProject);

      assert.equal(res.isRight, true);
      assert.deepEqual(unfoldRight(res), validProject);
    });
    it('returns Either Project for valid blink project', () => {
      const blinkProject = Helper.loadXodball('./fixtures/blinking.xodball');
      const res = Project.validateProject(blinkProject);

      assert.equal(res.isRight, true);
      assert.deepEqual(unfoldRight(res), blinkProject);
    });
    it('returns Either Project for valid variadic project', () => {
      const variadicsProject = Helper.loadXodball(
        './fixtures/variadics.xodball'
      );
      const res = Project.validateProject(variadicsProject);

      assert.equal(res.isRight, true);
      assert.deepEqual(unfoldRight(res), variadicsProject);
    });
  });

  describe('project surviving', () => {
    const brokenProject = Helper.loadXodball(
      './fixtures/broken-project.xodball'
    );
    const project = addMissingOptionalProjectFields(brokenProject);
    const curPatch = Project.getPatchByPathUnsafe('@/main', project);

    // :: NodeId -> Patch -> [PinKey]
    const getPinKeysByNodeId = R.compose(
      Maybe.maybe([], R.identity),
      R.map(R.compose(R.keys, Project.getPinsForNode(R.__, curPatch, project))),
      Patch.getNodeById
    );

    it('should add broken pins to nodes, that points to non-existing patch', () => {
      const pinKeysOut = getPinKeysByNodeId('brokenNodeOutLinks', curPatch);
      assert.lengthOf(pinKeysOut, 1);
      const pinKeysIn = getPinKeysByNodeId('brokenNodeInLinks', curPatch);
      assert.lengthOf(pinKeysIn, 2);
    });
    it('should add broken pins to valid nodes, that has connected links to non-existing pins', () => {
      const pinKeys = getPinKeysByNodeId('validNodeId', curPatch);
      assert.lengthOf(pinKeys, 5);
    });
  });

  describe('getPatchDependencies', () => {
    it('lists all patches used in a given patch and their dependencies', () => {
      const blinking = Helper.loadXodball('./fixtures/blinking.xodball');
      const deps = Project.getPatchDependencies('@/main', blinking);

      assert.deepEqual(deps, [
        '@/led',
        '@/blink',
        'xod/core/digital-output',
        'xod/patch-nodes/input-string',
        'xod/patch-nodes/input-number',
        'xod/math/multiply',
        'xod/patch-nodes/output-boolean',
        'xod/core/latch',
        'xod/core/clock',
        'xod/patch-nodes/not-implemented-in-xod',
        'xod/patch-nodes/output-number',
        'xod/patch-nodes/input-pulse',
        'xod/patch-nodes/output-pulse',
      ]);
    });
  });

  describe('getPinsForNode', () => {
    it('returns valid Pins for valid Patch & Node', () => {
      const project = Helper.loadXodball('./fixtures/blinking.xodball');
      const curPatch = Project.getPatchByPathUnsafe('@/main', project);
      const node = Patch.getNodeByIdUnsafe('BJ4l0cVdKe', curPatch);
      const pins = Project.getPinsForNode(node, curPatch, project);

      Helper.assertProps(pins.S1ulA9NuFx, {
        normalizedLabel: 'IN1',
        label: '',
        type: 'string',
        direction: 'input',
        value: 'LED1',
        order: 0,
      });
      Helper.assertProps(pins.B1wg0qVOtg, {
        normalizedLabel: 'IN2',
        label: '',
        type: 'number',
        direction: 'input',
        value: 0,
        order: 1,
      });
    });
    it('returns dead Pins for Node with broken input Links', () => {
      const brokenProject = Helper.loadXodball(
        './fixtures/broken-project.xodball'
      );
      const curPatch = Project.getPatchByPathUnsafe('@/main', brokenProject);
      const node = Patch.getNodeByIdUnsafe('brokenNodeInLinks', curPatch);
      const pins = Project.getPinsForNode(node, curPatch, brokenProject);

      Helper.assertProps(pins['Hkp4rion-'], {
        label: '',
        type: 'dead',
        direction: 'input',
        order: 0,
      });
      Helper.assertProps(pins.BJbHBjs2b, {
        label: '',
        type: 'dead',
        direction: 'input',
        order: 1,
      });
    });
    it('returns dead Pins for Node with broken output Links', () => {
      const brokenProject = Helper.loadXodball(
        './fixtures/broken-project.xodball'
      );
      const curPatch = Project.getPatchByPathUnsafe('@/main', brokenProject);
      const node = Patch.getNodeByIdUnsafe('brokenNodeOutLinks', curPatch);
      const pins = Project.getPinsForNode(node, curPatch, brokenProject);

      Helper.assertProps(pins['B1BSSsi3-'], {
        label: '',
        type: 'dead',
        direction: 'output',
        order: 0,
      });
    });
    it('returns dead Pins for valid Node with broken PinKey', () => {
      const brokenProject = Helper.loadXodball(
        './fixtures/broken-project.xodball'
      );
      const curPatch = Project.getPatchByPathUnsafe('@/main', brokenProject);
      const node = Patch.getNodeByIdUnsafe('validNodeId', curPatch);
      const pins = Project.getPinsForNode(node, curPatch, brokenProject);

      Helper.assertProps(pins.brokenPinKey, {
        label: '',
        type: 'dead',
        direction: 'input',
      });
    });
    it('returns valid Pins for variadic Node with arityLevel === 4 and unlabeled pins', () => {
      const project = Helper.loadXodball('./fixtures/variadics.xodball');
      const curPatch = Project.getPatchByPathUnsafe('@/main', project);
      const node = Patch.getNodeByIdUnsafe('HytU4ZsDz', curPatch);
      const pins = Project.getPinsForNode(node, curPatch, project);

      assert.lengthOf(R.keys(pins), 6);
      Helper.assertProps(pins.rk6Q4Ziwf, {
        label: '',
        type: 'number',
        direction: 'input',
        value: 0,
        order: 1,
      });
      Helper.assertProps(pins['rk6Q4Ziwf-$1'], {
        label: '',
        type: 'number',
        direction: 'input',
        value: 0,
        order: 2,
      });
      Helper.assertProps(pins['rk6Q4Ziwf-$3'], {
        label: '',
        type: 'number',
        direction: 'input',
        value: 0,
        order: 4,
      });
    });
    it('returns valid Pins for variadic Node with arityLevel === 2 and labeled pins', () => {
      const project = Helper.loadXodball('./fixtures/variadics.xodball');
      const curPatch = Project.getPatchByPathUnsafe('@/main', project);
      const node = Patch.getNodeByIdUnsafe('S1z24-iPG', curPatch);
      const pins = Project.getPinsForNode(node, curPatch, project);

      assert.lengthOf(R.keys(pins), 7);
      Helper.assertProps(pins['SJb3uE-sPf'], {
        label: 'D',
        type: 'number',
        direction: 'input',
        value: 0,
        order: 3,
      });
      Helper.assertProps(pins['SJb3uE-sPf-$1'], {
        label: 'D2',
        type: 'number',
        direction: 'input',
        value: 0,
        order: 4,
      });
    });
    it('returns valid Pins for variadic Node with arityLevel === 3 and labeled pins with numbers and ariteStep === 2', () => {
      const project = Helper.loadXodball('./fixtures/variadics.xodball');
      const curPatch = Project.getPatchByPathUnsafe('@/main', project);
      const node = Patch.getNodeByIdUnsafe('SkTgS-ovf', curPatch);
      const pins = Project.getPinsForNode(node, curPatch, project);

      assert.lengthOf(R.keys(pins), 10);

      Helper.assertProps(pins.S1Z1AEZsvf, {
        label: 'A2',
        type: 'number',
        direction: 'input',
        value: 0,
        order: 2,
      });
      Helper.assertProps(pins['S1Z1AEZsvf-$1'], {
        label: 'A3',
        type: 'number',
        direction: 'input',
        value: 0,
        order: 4,
      });
      Helper.assertProps(pins['S1Z1AEZsvf-$2'], {
        label: 'A4',
        type: 'number',
        direction: 'input',
        value: 0,
        order: 6,
      });

      Helper.assertProps(pins.HkzJCNbivG, {
        label: 'B2',
        type: 'number',
        direction: 'input',
        value: 0,
        order: 3,
      });
      Helper.assertProps(pins['HkzJCNbivG-$1'], {
        label: 'B3',
        type: 'number',
        direction: 'input',
        value: 0,
        order: 5,
      });
      Helper.assertProps(pins['HkzJCNbivG-$2'], {
        label: 'B4',
        type: 'number',
        direction: 'input',
        value: 0,
        order: 7,
      });
    });
  });
});
