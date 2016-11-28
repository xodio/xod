import R from 'ramda';
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

  describe('helpers', () => {
    it('assocRight should return Object wrapped by Either.Right', () => {
      expect(Utils.assocRight('test', 'testVal', {}).isRight).to.be.true();
    });
    it('leaveError should return Error wrapped by Either.Left', () => {
      expect(Utils.leaveError('error message')().isLeft).to.be.true();
    });
  });
});
