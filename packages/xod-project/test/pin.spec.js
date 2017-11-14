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
      const pin = Helper.defaultizePin({ type: CONST.PIN_TYPE.NUMBER });
      expect(Pin.getPinType(pin)).to.be.equal(CONST.PIN_TYPE.NUMBER);
    });
  });
  describe('getPinKey', () => {
    it('should return pin key for pin object', () => {
      const pin = Helper.defaultizePin({ key: 'a' });
      expect(Pin.getPinKey(pin)).to.be.equal('a');
    });
    it('should return string for string', () => {
      const pin = 'a';
      expect(Pin.getPinKey(pin)).to.be.equal('a');
    });
  });

  describe('getPinLabel', () => {
    it('should return pin label', () => {
      const pin = Helper.defaultizePin({ label: 'LED1' });
      expect(Pin.getPinLabel(pin)).to.be.equal('LED1');
    });
  });

  describe('getPinDescription', () => {
    it('should return pin description', () => {
      const pin = Helper.defaultizePin({ description: 'my awesome pin' });
      expect(Pin.getPinDescription(pin)).to.be.equal('my awesome pin');
    });
  });

  describe('getPinOrder', () => {
    it('should return pin order', () => {
      const pin = Helper.defaultizePin({ order: 66 });
      expect(Pin.getPinOrder(pin)).to.be.equal(66);
    });
  });

  // is input / output
  describe('isInputPin / isOutputPin', () => {
    it('should honor output direction', () => {
      const pin = Helper.defaultizePin({ direction: CONST.PIN_DIRECTION.OUTPUT });
      expect(Pin.isInputPin(pin)).to.be.false();
      expect(Pin.isOutputPin(pin)).to.be.true();
    });
    it('should honor input direction', () => {
      const pin = Helper.defaultizePin({ direction: CONST.PIN_DIRECTION.INPUT });
      expect(Pin.isInputPin(pin)).to.be.true();
      expect(Pin.isOutputPin(pin)).to.be.false();
    });
  });
  describe('isTerminalPin', () => {
    it('should return false for non-terminal pin', () => {
      const pin = Helper.defaultizePin({ key: 'a' });
      expect(Pin.isTerminalPin(pin)).to.be.false();
    });
    it('should return true for terminal input', () => {
      const pin = Helper.defaultizePin({
        key: CONST.TERMINAL_PIN_KEYS[CONST.PIN_DIRECTION.INPUT],
      });
      expect(Pin.isTerminalPin(pin)).to.be.true();
    });
    it('should return true for terminal output', () => {
      const pin = Helper.defaultizePin({
        key: CONST.TERMINAL_PIN_KEYS[CONST.PIN_DIRECTION.OUTPUT],
      });
      expect(Pin.isTerminalPin(pin)).to.be.true();
    });
  });
  describe('isPulsePin', () => {
    it('should return false for non-pulse pin', () => {
      const pin = Helper.defaultizePin({ type: CONST.PIN_TYPE.STRING });
      expect(Pin.isPulsePin(pin)).to.be.false();
    });
    it('should return true for pulse pin', () => {
      const pin = Helper.defaultizePin({ type: CONST.PIN_TYPE.PULSE });
      expect(Pin.isPulsePin(pin)).to.be.true();
    });
  });
  describe('normalizePinLabels', () => {
    it('should return list of pins with unique labels', () => {
      const pins = [
        { label: 'A' },
        { label: 'A' },
        { label: 'B' },
        { label: 'IN', direction: CONST.PIN_DIRECTION.INPUT },
        { label: '', direction: CONST.PIN_DIRECTION.INPUT },
        { label: '', direction: CONST.PIN_DIRECTION.INPUT },
        { label: '', direction: CONST.PIN_DIRECTION.OUTPUT },
      ].map(Helper.defaultizePin);
      const pinsExpected = [
        { label: 'A1' },
        { label: 'A2' },
        { label: 'B' },
        { label: 'IN1', direction: CONST.PIN_DIRECTION.INPUT },
        { label: 'IN2', direction: CONST.PIN_DIRECTION.INPUT },
        { label: 'IN3', direction: CONST.PIN_DIRECTION.INPUT },
        { label: 'OUT', direction: CONST.PIN_DIRECTION.OUTPUT },
      ].map(Helper.defaultizePin);

      expect(Pin.normalizePinLabels(pins)).to.be.deep.equal(pinsExpected);
    });
  });
});
