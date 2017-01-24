import { Maybe } from 'ramda-fantasy';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import * as Tools from '../src/func-tools';
import * as Helper from './helpers';

chai.use(dirtyChai);

describe('Functional tools', () => {
  describe('deepClone', () => {
    const a = { a: 25, b: 'b', c: { c: true } };

    it('should return new object', () => {
      const cloned = Tools.deepClone(a);
      expect(cloned).to.be.not.equal(a);
      expect(cloned.c).to.be.not.equal(a.c);
    });
    it('should return deeply cloned object', () => {
      expect(Tools.deepClone(a))
        .to.be.deep.equal(a);
    });
  });
  describe('err', () => {
    const errMsg = 'error message';
    const testObj = Tools.err(errMsg)();

    it('should return Either.Left', () => {
      expect(testObj.isLeft).to.be.true();
    });
    it('should contain Error', () => {
      /* istanbul ignore next */
      testObj.chain((val) => {
        expect(val)
          .to.be.an.instanceof(Error)
          .and.equal('testVal')
          .and.have.property('message')
          .that.equal(errMsg);
      });
    });
  });
  describe('errOnFalse', () => {
    it('should be Either.Left for false', () => {
      const errMessage = 'test';
      const res = Tools.errOnFalse(errMessage, () => false)({});
      expect(res.isLeft).to.be.true();
      Helper.expectErrorMessage(expect, res, errMessage);
    });
    it('should be Either.Right for true', () => {
      const obj = {};
      const res = Tools.errOnFalse('test', () => true)(obj);
      expect(res.isRight).to.be.true();
      Helper.expectEither(
        val => expect(val).to.be.equal(obj),
        res
      );
    });
  });
  describe('errOnNothing', () => {
    it('should return Either.Left for Maybe.Nothing', () => {
      const errMessage = 'test passed';
      const nothing = Maybe.Nothing(); // eslint-disable-line new-cap
      const either = Tools.errOnNothing(errMessage, nothing);
      expect(either.isLeft).to.be.true();
      Helper.expectErrorMessage(expect, either, errMessage);
    });
    it('should return Either.Right for Maybe.Just', () => {
      const content = {};
      const just = Maybe.of(content);
      const either = Tools.errOnNothing({}, just);
      expect(either.isRight).to.be.true();
      Helper.expectEither(
        val => expect(val).to.be.equal(content),
        either
      );
    });
  });
});
