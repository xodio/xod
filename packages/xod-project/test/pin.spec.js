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
  // props optional
  describe('props', () => {
    function expectGetterSetter(getter, setter, testValue) {
      const pin = Helper.defaultizePin({});
      const newPin = setter(testValue, pin);
      const newValue = getter(newPin);
      expect(newPin).not.equal(pin);
      expect(newValue).to.equal(testValue);
    }

    it('should access label', () => {
      expectGetterSetter(Pin.getPinLabel, Pin.setPinLabel, 'foo');
    });

    it('should access description', () => {
      expectGetterSetter(Pin.getPinDescription, Pin.setPinDescription, 'foo bar baz');
    });

    it('should access order', () => {
      expectGetterSetter(Pin.getPinOrder, Pin.setPinOrder, 42);
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
});
