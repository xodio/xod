import R from 'ramda';
import { Either } from 'ramda-fantasy';

import * as defaults from '../src/defaults';

export const expectEither = R.curry((testFunction, object) => {
  Either.either(
    (err) => { throw err; },
    testFunction,
    object
  );
});

export const expectErrorMessage = R.curry((expect, err, originalMessage) => {
  const check = (errObj) => {
    expect(errObj).to.be.an('Error');
    expect(errObj.toString()).to.be.equal(new Error(originalMessage).toString());
  };

  if (err instanceof Either) {
    Either.either(
      check,
      (val) => { throw new Error(`Expected Error but returned ${val}`); },
      err
    );
    return;
  }

  check(err);
});

export const expectOptionalStringGetter = R.curry((expect, method, propName) => {
  it(`should return empty string for undefined ${propName}`, () => {
    expect(method({})).to.be.equal('');
  });
  it(`should return ${propName}`, () => {
    const val = 'test';
    expect(method({ [propName]: val })).to.be.equal(val);
  });
});

export const expectOptionalStringSetter = R.curry((expect, method, propName) => {
  it(`should return new object with assigned ${propName}`, () => {
    const val = 'test';
    const object = {};
    const newobject = method(val, object);
    expect(newobject)
      .to.be.an('object')
      .and.have.property(propName)
      .to.be.equal(val);
    expect(newobject).to.be.not.equal(object);
  });
  it(`should convert other types into string and assign ${propName}`, () => {
    expect(method(5, {}))
      .to.have.property(propName).to.be.equal('5');
  });
});

export const expectOptionalNumberGetter = R.curry((expect, method, propName) => {
  it(`should return 0 for undefined ${propName}`, () => {
    expect(method({})).to.be.equal(0);
  });
  it(`should return ${propName}`, () => {
    const val = 5;
    expect(method({ [propName]: val })).to.be.equal(val);
  });
});

export const expectOptionalNumberSetter = R.curry((expect, method, propName) => {
  it(`should return new object with assigned ${propName}`, () => {
    const val = 5;
    const object = {};
    const newobject = method(val, object);
    expect(newobject)
      .to.be.an('object')
      .and.have.property(propName)
      .to.be.equal(val);
    expect(newobject).to.be.not.equal(object);
  });
  it(`should convert other types into number and assign ${propName}`, () => {
    expect(method('5', {}))
      .to.have.property(propName).to.be.equal(5);
  });
  it('should assign 0 if converted value is NaN', () => {
    expect(method('zca', {}))
      .to.have.property(propName).to.be.equal(0);
  });
});

//-----------------------------------------------------------------------------
// Defaultizers
//-----------------------------------------------------------------------------

export const defaultizeLink = defaults.defaultizeLink;

export const defaultizeNode = defaults.defaultizeNode;

export const defaultizePin = defaults.defaultizePin;

export const defaultizePatch = defaults.defaultizePatch;

export const defaultizeProject = defaults.defaultizeProject;
