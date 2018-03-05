import { Maybe } from 'ramda-fantasy';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import * as Tools from '../src/func-tools';
import * as Helper from './helpers';

chai.use(dirtyChai);

describe('Functional tools', () => {
  describe('err', () => {
    const errMsg = 'error message';
    const testObj = Tools.err(errMsg)();

    it('should return Either.Left', () => {
      expect(testObj.isLeft).to.be.true();
    });
    it('should contain Error', () => {
      /* istanbul ignore next */
      testObj.chain(val => {
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
      Helper.expectEitherError(errMessage, res);
    });
    it('should be Either.Right for true', () => {
      const obj = {};
      const res = Tools.errOnFalse('test', () => true)(obj);
      Helper.expectEitherRight(val => expect(val).to.be.equal(obj), res);
    });
  });
  describe('errOnNothing', () => {
    it('should return Either.Left for Maybe.Nothing', () => {
      const errMessage = 'test passed';
      const nothing = Maybe.Nothing(); // eslint-disable-line new-cap
      const either = Tools.errOnNothing(errMessage, nothing);
      Helper.expectEitherError(errMessage, either);
    });
    it('should return Either.Right for Maybe.Just', () => {
      const content = {};
      const just = Maybe.of(content);
      const either = Tools.errOnNothing({}, just);
      Helper.expectEitherRight(val => expect(val).to.be.equal(content), either);
    });
  });
});
