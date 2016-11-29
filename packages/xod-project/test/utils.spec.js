import R from 'ramda';
import { Either } from 'ramda-fantasy';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import * as Utils from '../src/utils';

chai.use(dirtyChai);

describe('Utils', () => {
  const notArrayShouldBeFalse = (f) => {
    expect(f({})).to.be.false();
    expect(f(1)).to.be.false();
    expect(f('asd')).to.be.false();
    expect(f(true)).to.be.false();
  };

  describe('isArrayOfStrings', () => {
    const toBeTrue = (value) => {
      expect(Utils.isArrayOfStrings(value)).to.be.true();
    };
    const toBeFalse = (value) => {
      expect(Utils.isArrayOfStrings(value)).to.be.false();
    };

    it('should return true for empty array', () => {
      toBeTrue([]);
    });
    it('should return true to array with only strings', () => {
      toBeTrue(['test', 'test2']);
    });
    it('should return false for not-array', () => {
      notArrayShouldBeFalse(Utils.isArrayOfStrings);
    });
    it('should return false to array with numbers', () => {
      toBeFalse([1, 2]);
    });
    it('should return false to array with mixed types', () => {
      toBeFalse(['test', 6, {}, 'test2']);
    });
  });

  describe('isArrayOfNumbers', () => {
    const toBeTrue = (value) => {
      expect(Utils.isArrayOfNumbers(value)).to.be.true();
    };
    const toBeFalse = (value) => {
      expect(Utils.isArrayOfNumbers(value)).to.be.false();
    };

    it('should return true for empty array', () => {
      toBeTrue([]);
    });
    it('should return true to array with only numbers', () => {
      toBeTrue([1, 2, 3]);
    });
    it('should return false for not-array', () => {
      notArrayShouldBeFalse(Utils.isArrayOfNumbers);
    });
    it('should return false to array with strings', () => {
      toBeFalse(['test', 'test2']);
    });
    it('should return false to array with mixed types', () => {
      toBeFalse(['test', 6, {}, 'test2']);
    });
  });

  describe('validatePath', () => {
    it('should be Either.Left for not valid paths', () => {
      expect(Utils.validatePath('').isLeft).to.be.true();
      expect(Utils.validatePath('кириллица').isLeft).to.be.true();
      expect(Utils.validatePath('spa ce').isLeft).to.be.true();
      expect(Utils.validatePath('spçiålÇhÅr$').isLeft).to.be.true();
      expect(Utils.validatePath('dots.in.names').isLeft).to.be.true();
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
      Either.either(
        (err) => { throw err; },
        (val) => { expect(val).to.be.equal(path); },
        result
      );
    });
  });

  describe('helpers', () => {
    it('assocRight should return Object wrapped by Either.Right', () => {
      expect(Utils.assocRight('test', 'testVal', {}).isRight).to.be.true();
    });
    it('leaveError should return Error wrapped by Either.Left', () => {
      expect(Utils.leaveError('error message')().isLeft).to.be.true();
    });
  });
});
