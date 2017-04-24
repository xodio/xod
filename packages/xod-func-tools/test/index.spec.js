import { assert, expect } from 'chai';
import { identity, F } from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';

import { explode, foldEither, tapP } from '../src/index';

describe('explode', () => {
  it('should return Maybe.Just value', () => {
    expect(explode(Maybe.Just(25)))
      .to.be.equal(25);
  });
  it('should throw error for Maybe.Nothing', () => {
    const fn = () => explode(Maybe.Nothing());
    expect(fn).to.throw(Error);
  });
  it('should return Either.Right value', () => {
    expect(explode(Either.Right(25)))
      .to.be.equal(25);
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
    assert.equal(
      foldEither(identity, F, Either.Left('left')),
      'left'
    );
  });
  it('should return Right value for Right', () => {
    assert.equal(
      foldEither(F, identity, Either.Right('right')),
      'right'
    );
  });
});
describe('tapP', () => {
  it('should return the same value', () => {
    const promiseFn = () => new Promise((resolve) => {
      setTimeout(() => resolve(true), 5);
    });

    Promise.resolve(1)
      .then(tapP(promiseFn))
      .then(value => assert.equal(value, 1));
  });
  it('should pass argument into promiseFn', () => {
    const promiseFn = arg => new Promise((resolve) => {
      const newValue = arg + 5;
      assert.equal(newValue, 6);
      setTimeout(() => resolve(newValue), 5);
    });

    Promise.resolve(1)
      .then(tapP(promiseFn));
  });
  it('should return Promise.reject if inner function return Promise.reject', () => {
    const promiseFn = () => Promise.reject('reject');

    Promise.resolve(1)
      .then(tapP(promiseFn))
      .catch(out => assert.equal(out, 'reject'));
  });
});
