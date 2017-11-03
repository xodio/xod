import { curry } from 'ramda';
import { assert } from 'chai';

import {
  tapP,
  retryOrFail,
} from '../src/promises';

describe('promises', () => {
  describe('tapP()', () => {
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

  describe('retryOrFail()', () => {
    const checkFn = curry((errTime, newTime) => (newTime > errTime));
    const errFn = curry((errTime, newTime) => {
      throw new Error(`It failed somehow: ${newTime} is over ${errTime}`);
    });

    it('should retry two times and return resolved promise', () => {
      const now = Date.now();
      const until = now + 50;
      const errTime = now + 200;

      let count = 0;

      return retryOrFail(
        [25, 25, 150],
        checkFn(errTime),
        errFn(errTime),
        () => {
          count += 1;
          const newTime = Date.now();
          return (newTime >= until) ? Promise.resolve(newTime) : Promise.reject(newTime);
        },
      )().then((resTime) => {
        assert.equal(count, 2);
        assert.isTrue(resTime >= until && resTime < errTime);
      });
    });
    it('should retry three times and return rejected promise, cause tries is left', () => {
      const now = Date.now();
      const until = now + 50;
      const errTime = now + 100;

      let count = 0;

      return retryOrFail(
        [5, 5, 5],
        checkFn(errTime),
        errFn(errTime),
        () => {
          count += 1;
          const newTime = Date.now();
          return (newTime >= until) ? Promise.resolve(newTime) : Promise.reject(newTime);
        },
      )().catch((err) => {
        assert.equal(count, 3);
        assert.instanceOf(err, Error);
      });
    });
    it('should retry and fails by predicate', () => {
      const now = Date.now();
      const until = now + 120;
      const errTime = now + 20;

      let count = 0;

      return retryOrFail(
        [10, 10, 100],
        checkFn(errTime),
        errFn(errTime),
        () => {
          count += 1;
          const newTime = Date.now();
          return (newTime >= until) ? Promise.resolve(newTime) : Promise.reject(newTime);
        },
      )().catch((err) => {
        assert.equal(count, 2);
        assert.instanceOf(err, Error);
      });
    });
  });
});
