import R from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import shortid from 'shortid';

import * as CONST from '../src/constants';
import * as Utils from '../src/utils';

import * as Helper from './helpers';

chai.use(dirtyChai);

describe('Utils', () => {
  describe('explode', () => {
    it('should return Maybe.Just value', () => {
      expect(Utils.explode(Maybe.Just(25)))
        .to.be.equal(25);
    });
    it('should throw error for Maybe.Nothing', () => {
      const fn = () => Utils.explode(Maybe.Nothing());
      expect(fn).to.throw(Error);
    });
    it('should return Either.Right value', () => {
      expect(Utils.explode(Either.Right(25)))
        .to.be.equal(25);
    });
    it('should throw error for Either.Left', () => {
      const errMsg = 'err';
      const fn = () => Utils.explode(Either.Left(errMsg));
      expect(fn).to.throw(Error);
    });
    it('should throw error if its not Maybe or Either', () => {
      const fn = () => Utils.explode(5);
      expect(fn).to.throw(Error);
    });
  });

  describe('getBaseName', () => {
    it('should return base name extracted from path', () => {
      const baseName = 'test';
      const path = `@/folder/${baseName}`;
      const result = Utils.getBaseName(path);
      expect(result).to.be.equal(baseName);
    });
  });

  describe('validatePath', () => {
    it('should be Either.Left for not valid paths', () => {
      const err1 = Utils.validatePath('');
      const err2 = Utils.validatePath('dots.in.names');
      expect(err1.isLeft).to.be.true();
      expect(Utils.validatePath('кириллица').isLeft).to.be.true();
      expect(Utils.validatePath('spa ce').isLeft).to.be.true();
      expect(Utils.validatePath('spçiålÇhÅr$').isLeft).to.be.true();
      expect(err2.isLeft).to.be.true();

      Helper.expectErrorMessage(expect, err1, CONST.ERROR.PATH_INVALID);
      Helper.expectErrorMessage(expect, err2, CONST.ERROR.PATH_INVALID);
    });
    it('should be Either.Right for valid paths', () => {
      expect(Utils.validatePath('@/patchName').isRight).to.be.true();
      expect(Utils.validatePath('@/folder/subfolder/patchName').isRight).to.be.true();
      expect(Utils.validatePath('@/folder_underscored/patch_name_underscored').isRight).to.be.true();
      expect(Utils.validatePath('@/folder-dashed/patch-name-dashed').isRight).to.be.true();
      expect(Utils.validatePath('not/a/local/patchName').isRight).to.be.true();
      expect(Utils.validatePath('not/a/local/patch-name-dashed').isRight).to.be.true();
      expect(Utils.validatePath('not/a/local/patch_name_underscored').isRight).to.be.true();
    });
    it('should be Either.Right should containt correct value', () => {
      const path = '@/folder/subFolder/patchName';
      const result = Utils.validatePath(path);
      expect(result.isRight).to.be.true();

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
      { id: 0, was: 'a' },
      { id: 1, was: 'b' },
      { id: 2, was: 'c' },
    ];
    const expectedLinks = [
      { id: 'x', input: { nodeId: 1 }, output: { nodeId: 0 } },
      { id: 'y', input: { nodeId: 2 }, output: { nodeId: 1 } },
    ];

    it('guidToIdx: should return an empty map for empty nodes', () => {
      expect(Utils.guidToIdx({}))
        .to.be.an('object')
        .and.to.be.empty();
    });
    it('guidToIdx: should return a map oldId to newId', () => {
      expect(Utils.guidToIdx(nodes))
        .to.be.deep.equal({
          a: 0,
          b: 1,
          c: 2,
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
