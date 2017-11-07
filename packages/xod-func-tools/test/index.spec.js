import { assert, expect } from 'chai';
import { curry, identity, F } from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';

import {
  explode,
  explodeEither,
  foldEither,
  tapP,
  reduceMaybe,
  reduceEither,
  omitRecursively,
  uniqLists,
} from '../src/index';

describe('explode', () => {
  it('should return Maybe.Just value', () => {
    expect(explode(Maybe.Just(25))).to.be.equal(25);
  });
  it('should throw error for Maybe.Nothing', () => {
    const fn = () => explode(Maybe.Nothing());
    expect(fn).to.throw(Error);
  });
  it('should return Either.Right value', () => {
    expect(explode(Either.Right(25))).to.be.equal(25);
  });
  it('should throw error for Either.Left', () => {
    const errMsg = 'err';
    const fn = () => explode(Either.Left(errMsg));
    expect(fn).to.throw(Error);
  });
  it('should throw error if its not Maybe or Either', () => {
    const fn = () => explode(5);
    expect(fn).to.throw(Error);
  });
});
describe('foldEither', () => {
  it('should return Left value for Left', () => {
    assert.equal(foldEither(identity, F, Either.Left('left')), 'left');
  });
  it('should return Right value for Right', () => {
    assert.equal(foldEither(F, identity, Either.Right('right')), 'right');
  });
});
describe('tapP', () => {
  it('should return the same value', () => {
    const promiseFn = () =>
      new Promise(resolve => {
        setTimeout(() => resolve(true), 5);
      });

    Promise.resolve(1)
      .then(tapP(promiseFn))
      .then(value => assert.equal(value, 1));
  });
  it('should pass argument into promiseFn', () => {
    const promiseFn = arg =>
      new Promise(resolve => {
        const newValue = arg + 5;
        assert.equal(newValue, 6);
        setTimeout(() => resolve(newValue), 5);
      });

    Promise.resolve(1).then(tapP(promiseFn));
  });
  it('should return Promise.reject if inner function return Promise.reject', () => {
    const promiseFn = () => Promise.reject('reject');

    Promise.resolve(1)
      .then(tapP(promiseFn))
      .catch(out => assert.equal(out, 'reject'));
  });
});
describe('reduceM', () => {
  it('should return correct Maybe Result', () => {
    const maybeFn = curry(
      (acc, a) => (a === 10 ? Maybe.Nothing() : Maybe.of(acc + a))
    );

    const a = reduceMaybe(maybeFn, 0, [1, 2, 3, 4]);
    assert.isTrue(a.isJust);
    assert.equal(a.getOrElse(null), 10);

    const b = reduceMaybe(maybeFn, 0, [5, 10, 15]);
    assert.isTrue(b.isNothing);

    const c = reduceMaybe(maybeFn, 0, []);
    assert.isTrue(c.isJust);
    assert.equal(c.getOrElse(null), 0);
  });
  it('should return correct Either Result', () => {
    const eitherFn = (acc, a) =>
      a === 10 ? Either.Left(100500) : Either.Right(acc + a);

    const right = reduceEither(eitherFn, 0, [1, 2, 3, 4]);
    assert.isTrue(right.isRight);
    assert.equal(explodeEither(right), 10);

    const left = reduceEither(eitherFn, 0, [5, 10, 15]);
    assert.isTrue(left.isLeft);

    const wrapped = reduceEither(eitherFn, 0, []);
    assert.isTrue(wrapped.isRight);
    assert.equal(explodeEither(wrapped), 0);
  });
});

describe('omitRecursively', () => {
  it('omits values in deeply nested objects', () => {
    const obj = {
      omitMe: 'hello',
      foo: 2,
      bar: {
        qux: 4,
        moo: ['a', 'b', 'c'],
        baz: {
          omitMe: 'ola',
          quux: 6,
        },
      },
    };

    const cleanObj = omitRecursively(['omitMe'], obj);
    assert.deepEqual(cleanObj, {
      foo: 2,
      bar: {
        qux: 4,
        moo: ['a', 'b', 'c'],
        baz: {
          quux: 6,
        },
      },
    });
  });

  it('omits values in objects nested in arrays', () => {
    const obj = [[{ omitMe: 'hello', foo: 2 }]];
    const cleanObj = omitRecursively(['omitMe'], obj);
    assert.deepEqual(cleanObj, [[{ foo: 2 }]]);
  });
});

describe('uniqLists', () => {
  it('returns filtered list', () => {
    assert.deepEqual(
      uniqLists([['a', 'b', 'c'], ['b', 'c', 'd'], ['a', 'd', 'e', 'f']]),
      [['a', 'b', 'c'], ['d'], ['e', 'f']]
    );
  });
  it('returns filtered list with untouched empty lists', () => {
    assert.deepEqual(uniqLists([['a', 'b', 'c'], ['b', 'c', 'd'], [], []]), [
      ['a', 'b', 'c'],
      ['d'],
      [],
      [],
    ]);
  });
  it('returns empty list for empty list', () => {
    assert.deepEqual(uniqLists([]), []);
  });
});
