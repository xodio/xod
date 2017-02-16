import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import * as Pin from '../src/pin';
import * as CONST from '../src/constants';

import * as Helper from './helpers';

chai.use(dirtyChai);

describe('Pin', () => {
  // props required
  describe('getPinType', () => {
    it('should return pin type', () => {
      const pin = { type: CONST.PIN_TYPE.NUMBER };
      expect(Pin.getPinType(pin)).to.be.equal(CONST.PIN_TYPE.NUMBER);
    });
  });
  describe('getPinKey', () => {
    it('should return pin key for pin object', () => {
      const pin = { key: 'a' };
      expect(Pin.getPinKey(pin)).to.be.equal('a');
    });
    it('should return string for string', () => {
      const pin = 'a';
      expect(Pin.getPinKey(pin)).to.be.equal('a');
    });
  });
  // props optional
  describe('getPinLabel', () => {
    Helper.expectOptionalStringGetter(expect, Pin.getPinLabel, 'label');
  });
  describe('setPinLabel', () => {
    Helper.expectOptionalStringSetter(expect, Pin.setPinLabel, 'label');
  });
  describe('getPinDescription', () => {
    Helper.expectOptionalStringGetter(expect, Pin.getPinDescription, 'description');
  });
  describe('setPinDescription', () => {
    Helper.expectOptionalStringSetter(expect, Pin.setPinDescription, 'description');
  });
  describe('getPinOrder', () => {
    Helper.expectOptionalNumberGetter(expect, Pin.getPinOrder, 'order');
  });
  describe('setPinOrder', () => {
    Helper.expectOptionalNumberSetter(expect, Pin.setPinOrder, 'order');
  });
  // is input / output
  describe('isInputPin', () => {
    it('should return false for empty pin', () => {
      expect(Pin.isInputPin({})).to.be.false();
    });
    it('should return false for pin with output direction', () => {
      expect(Pin.isInputPin({ direction: CONST.PIN_DIRECTION.OUTPUT })).to.be.false();
    });
    it('should return true for pin with input direction', () => {
      expect(Pin.isInputPin({ direction: CONST.PIN_DIRECTION.INPUT })).to.be.true();
    });
  });
  describe('isOutputPin', () => {
    it('should return false for empty pin', () => {
      expect(Pin.isOutputPin({})).to.be.false();
    });
    it('should return false for pin with input direction', () => {
      expect(Pin.isOutputPin({ direction: CONST.PIN_DIRECTION.INPUT })).to.be.false();
    });
    it('should return true for pin with output direction', () => {
      expect(Pin.isOutputPin({ direction: CONST.PIN_DIRECTION.OUTPUT })).to.be.true();
    });
  });
  describe('isTerminalPin', () => {
    it('should return false for empty pin', () => {
      expect(Pin.isTerminalPin({})).to.be.false();
    });
    it('should return false for non-terminal pin', () => {
      expect(Pin.isTerminalPin({ key: 'a' })).to.be.false();
    });
    it('should return true for terminal pin', () => {
      expect(Pin.isTerminalPin({ key: '__in__' })).to.be.true();
      expect(Pin.isTerminalPin({ key: '__out__' })).to.be.true();
    });
  });
});
