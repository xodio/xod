import { Either } from 'ramda-fantasy';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import * as Pin from '../src/pin';
import * as CONST from '../src/constants';

import * as Helper from './helpers';

chai.use(dirtyChai);

describe('Pin', () => {
  // Validations
  describe('validatePinType', () => {
    it('should return Either.Left for invalid type', () => {
      const invalid = Pin.validatePinType('a');
      expect(invalid.isLeft).to.be.true();
      Either.either(
        err => { Helper.expectErrorMessage(expect, err, CONST.ERROR.PIN_TYPE_INVALID); },
        () => {},
        invalid
      );
    });
    it('should return Either.Right for valid type', () => {
      const type = CONST.PIN_TYPE.NUMBER;
      const valid = Pin.validatePinType(type);
      expect(valid.isRight).to.be.true();
      Helper.expectEither(
        val => { expect(val).to.be.equal(type); },
        valid
      );
    });
  });
  describe('validatePinDirection', () => {
    it('should return Either.Left for invalid direction', () => {
      const invalid = Pin.validatePinDirection('a');
      expect(invalid.isLeft).to.be.true();
      Either.either(
        err => { Helper.expectErrorMessage(expect, err, CONST.ERROR.PIN_DIRECTION_INVALID); },
        () => {},
        invalid
      );
    });
    it('should return Either.Right for valid direction', () => {
      const direction = CONST.PIN_DIRECTION.INPUT;
      const valid = Pin.validatePinDirection(direction);
      expect(valid.isRight).to.be.true();
      Helper.expectEither(
        val => { expect(val).to.be.equal(direction); },
        valid
      );
    });
  });
  // constructors
  describe('createPin', () => {
    it('should return Either.Left for wrong pin type', () => {
      const newPin = Pin.createPin('test', 'a', 'i');
      expect(newPin.isLeft).to.be.true();
    });
    it('should return Either.Left for wrong pin direction', () => {
      const newPin = Pin.createPin('test', CONST.PIN_TYPE.NUMBER, 'i');
      expect(newPin.isLeft).to.be.true();
    });
    it('should return Either.Right with new Pin', () => {
      const key = 'test';
      const type = CONST.PIN_TYPE.NUMBER;
      const direction = CONST.PIN_DIRECTION.INPUT;
      const newPin = Pin.createPin(key, type, direction);
      expect(newPin.isRight).to.be.true();
      Helper.expectEither(
        pinObj => {
          expect(pinObj)
            .to.be.an('object')
            .that.deep.equal({
              key,
              type,
              direction,
            });
        },
        newPin
      );
    });
  });
  // props required
  describe('getPinType', () => {
    it('should return pin type', () => {
      const pin = { type: CONST.PIN_TYPE.NUMBER };
      expect(Pin.getPinType(pin)).to.be.equal(CONST.PIN_TYPE.NUMBER);
    });
  });
  describe('getPinKey', () => {
    it('should return pin key', () => {
      const pin = { key: 'a' };
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
});
