import R from 'ramda';
import { Either } from 'ramda-fantasy';

import { PIN_DIRECTION, PIN_TYPE } from '../src/constants';

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

export const defaultizeLink = R.merge({
  id: '$$defaultLinkId',
  input: { nodeId: '$$defaultInputNodeId', pinKey: '$$defaultInputPin' },
  output: { nodeId: '$$defaultOutputNodeId', pinKey: '$$defaultOutputPin' },
});

export const defaultizeNode = R.merge({
  id: '$$defaultNodeId',
  position: { x: 0, y: 0 },
  type: '@/default-type',
  label: '',
  description: '',
  boundValues: {},
});

export const defaultizePin = R.merge({
  key: '$$defaultPinKey',
  direction: PIN_DIRECTION.INPUT,
  label: '$$defaultLabel',
  type: PIN_TYPE.NUMBER,
  defaultValue: 0,
  order: 0,
  description: '$$defaultDesription',
  isBindable: true,
});

const assignIds = R.mapObjIndexed((entity, id) => R.assoc('id', id, entity));

export const defaultizePatch = R.compose(
  R.evolve({
    nodes: R.compose(
      assignIds,
      R.map(defaultizeNode)
    ),
    links: R.compose(
      assignIds,
      R.map(defaultizeLink)
    ),
    impls: R.identity,
  }),
  R.merge({
    nodes: {},
    links: {},
    impls: {},
    path: '@/default-patch-path',
    description: '',
  })
);

export const insertPatchPaths = R.evolve({
  patches: R.mapObjIndexed((patch, path) => R.assoc('path', path, patch)),
});

export const defaultizeProject = R.compose(
  insertPatchPaths,
  R.evolve({
    patches: R.map(defaultizePatch),
  }),
  R.merge({
    authors: [],
    license: '',
    description: '',
    version: '',
    patches: {},
    name: 'test-project-name',
  })
);
