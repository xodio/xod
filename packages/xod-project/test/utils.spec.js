import R from 'ramda';
import chai, { expect, assert } from 'chai';
import dirtyChai from 'dirty-chai';
import shortid from 'shortid';

import * as CONST from '../src/constants';
import * as Utils from '../src/utils';

import * as Helper from './helpers';

chai.use(dirtyChai);

describe('Utils', () => {
  describe('getBaseName', () => {
    it('should return base name extracted from path', () => {
      const baseName = 'test';
      const path = `@/folder/${baseName}`;
      const result = Utils.getBaseName(path);
      expect(result).to.be.equal(baseName);
    });
  });

  describe('isValidIdentifier', () => {
    it('should ensure that Identifier is alphanumeric, in lowercase and kebabcase', () => {
      assert.isTrue(Utils.isValidIdentifier('a'));
      assert.isTrue(Utils.isValidIdentifier('1'));
      assert.isTrue(Utils.isValidIdentifier('a-1'));
      assert.isTrue(Utils.isValidIdentifier('1-a'));
      assert.isTrue(Utils.isValidIdentifier('lower'));
      assert.isTrue(Utils.isValidIdentifier('lower-kebab'));
      assert.isTrue(Utils.isValidIdentifier('lower-kebab-123'));

      assert.isFalse(Utils.isValidIdentifier(''));
      assert.isFalse(Utils.isValidIdentifier('A'));
      assert.isFalse(Utils.isValidIdentifier('@'));
      assert.isFalse(Utils.isValidIdentifier('snake_case'));
      assert.isFalse(Utils.isValidIdentifier('camelCase'));
      assert.isFalse(Utils.isValidIdentifier('foo/bar'));
    });
    it('should ensure that Identifier does not start or end with hypen', () => {
      assert.isFalse(Utils.isValidIdentifier('-'));
      assert.isFalse(Utils.isValidIdentifier('-something'));
      assert.isFalse(Utils.isValidIdentifier('something-'));
    });
    it('should ensure that Identifier does not contain more than one hypen in a row', () => {
      assert.isFalse(Utils.isValidIdentifier('foo--bar'));
      assert.isFalse(Utils.isValidIdentifier('foo---bar'));
    });
  });

  describe('isValidPatchPath', () => {
    it('should accept local paths(@/some-valid-identifier)', () => {
      assert.isTrue(Utils.isValidPatchPath('@/some-identifier'));

      assert.isFalse(Utils.isValidPatchPath('@'));
      assert.isFalse(Utils.isValidPatchPath('@/'));
      assert.isFalse(Utils.isValidPatchPath('@/notAValidIdentifier'));
      assert.isFalse(Utils.isValidPatchPath('@/not_a_valid_identifier'));
      assert.isFalse(Utils.isValidPatchPath('@/extra/slashes'));
    });
    it('should accept library paths(author/lib-name/some-valid-identifier)', () => {
      assert.isTrue(Utils.isValidPatchPath('a/b/c'));
      assert.isTrue(Utils.isValidPatchPath('author/lib-name/some-identifier'));

      assert.isFalse(Utils.isValidPatchPath('//'));
      assert.isFalse(Utils.isValidPatchPath('invalid@author/lib-name/some-identifier'));
      assert.isFalse(Utils.isValidPatchPath('author/@invalid@libname@/some-identifier'));
      assert.isFalse(Utils.isValidPatchPath('author/lib-name/invalid@identifier'));

      assert.isFalse(Utils.isValidPatchPath('not-enough/slashes'));
      assert.isFalse(Utils.isValidPatchPath('way/too/much/slashes'));
    });
  });

  describe('validatePath', () => {
    it('should be Either.Left for not valid paths', () => {
      const err1 = Utils.validatePath('');
      const err2 = Utils.validatePath('dots.in.names');
      assert.isTrue(err1.isLeft);
      assert.isTrue(Utils.validatePath('кириллица').isLeft);
      assert.isTrue(Utils.validatePath('spa ce').isLeft);
      assert.isTrue(Utils.validatePath('spçiålÇhÅr$').isLeft);

      assert.isTrue(Utils.validatePath('@/folder/subfolder/patchName').isLeft);
      assert.isTrue(Utils.validatePath('@/patch_name_underscored').isLeft);
      assert.isTrue(err2.isLeft);

      Helper.expectErrorMessage(expect, err1, CONST.ERROR.PATH_INVALID);
      Helper.expectErrorMessage(expect, err2, CONST.ERROR.PATH_INVALID);
    });
    it('should be Either.Right for valid paths', () => {
      assert.isTrue(Utils.validatePath('@/patch-name').isRight);
      assert.isTrue(Utils.validatePath('author-name/library-name/patch-name').isRight);
    });
    it('should be Either.Right should containt correct value', () => {
      const path = '@/patchName';
      const result = Utils.validatePath(path);
      assert.isTrue(result.isRight);

      /* istanbul ignore next */
      Helper.expectEither(
        (val) => { expect(val).to.be.equal(path); },
        result
      );
    });
  });

  // transforming node ids
  describe('renumering of nodeIds', () => {
    const nodes = [
      { id: 'a', was: 'a' },
      { id: 'b', was: 'b' },
      { id: 'c', was: 'c' },
    ];
    const links = [
      { id: 'x', input: { nodeId: 'b' }, output: { nodeId: 'a' } },
      { id: 'y', input: { nodeId: 'c' }, output: { nodeId: 'b' } },
    ];
    const nodesIdMap = Utils.guidToIdx(nodes);

    const expectedNodes = [
      { id: '0', was: 'a' },
      { id: '1', was: 'b' },
      { id: '2', was: 'c' },
    ];
    const expectedLinks = [
      { id: 'x', input: { nodeId: '1' }, output: { nodeId: '0' } },
      { id: 'y', input: { nodeId: '2' }, output: { nodeId: '1' } },
    ];

    it('guidToIdx: should return an empty map for empty nodes', () => {
      expect(Utils.guidToIdx({}))
        .to.be.an('object')
        .and.to.be.empty();
    });
    it('guidToIdx: should return a map oldId to newId', () => {
      expect(Utils.guidToIdx(nodes))
        .to.be.deep.equal({
          a: '0',
          b: '1',
          c: '2',
        });
    });

    it('resolveNodeIds: should return nodes with new ids', () => {
      expect(Utils.resolveNodeIds(nodesIdMap, nodes))
        .to.be.deep.equal(expectedNodes);
    });
    it('resolveLinkNodeIds: should return links with resolved node ids', () => {
      expect(Utils.resolveLinkNodeIds(nodesIdMap, links))
        .to.be.deep.equal(expectedLinks);
    });
  });

  // etc
  describe('isPathLocal', () => {
    const localPath = '@/test';
    const libPath = 'vasya/superLibraru/test';

    it('should return true for localPath', () => {
      const result = Utils.isPathLocal(localPath);
      expect(result).to.be.true();
    });
    it('should return false for not a patch', () => {
      const result = Utils.isPathLocal({});
      expect(result).to.be.false();
    });
    it('should return false for libPath', () => {
      const result = Utils.isPathLocal(libPath);
      expect(result).to.be.false();
    });
  });
  describe('isPathLibrary', () => {
    const localPath = '@/test';
    const libPath = 'vasya/superLibraru/test';

    it('should return true for libPath', () => {
      const result = Utils.isPathLibrary(libPath);
      expect(result).to.be.true();
    });
    it('should return false for not a patch', () => {
      const result = Utils.isPathLocal({});
      expect(result).to.be.false();
    });
    it('should return false for localPath', () => {
      const result = Utils.isPathLibrary(localPath);
      expect(result).to.be.false();
    });
  });

  describe('getLibraryName', () => {
    const localPath = '@/test';
    const libName = 'vasya/superLibrary';
    const libPath = `${libName}/test`;

    it('should return library name for libPath', () => {
      const result = Utils.getLibraryName(libPath);
      expect(result).to.be.equal(libName);
    });
    it('should return @ for localPath', () => {
      const result = Utils.getLibraryName(localPath);
      expect(result).to.be.equal('@');
    });
  });

  describe('generateId', () => {
    it('should be valid shortid', () => {
      const id = Utils.generateId();
      expect(shortid.isValid(id)).to.be.true();
    });
    it('should return new ids each time', () => {
      const ids = R.uniq(R.times(Utils.generateId, 5));
      expect(ids).to.have.lengthOf(5);
    });
  });
  describe('validateId', () => {
    it('should return false for invalid id', () => {
      const id = 'i have spaces и немного кириллицы';
      expect(shortid.isValid(id)).to.be.false();
    });
    it('should be valid shortid', () => {
      const id = '123aBc';
      expect(shortid.isValid(id)).to.be.true();
    });
  });
});
