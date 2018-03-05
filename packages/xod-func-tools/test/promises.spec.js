import R from 'ramda';
import { assert } from 'chai';

import { tapP, retryOrFail } from '../src/promises';

describe('promises', () => {
  describe('tapP()', () => {
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

  describe('retryOrFail()', () => {
    it('should keep retrying until there are no tries left', () => {
      const retriesSchedule = [1, 1, 1, 1];
      let retriesCount = 0;

      const result = retryOrFail(
        retriesSchedule,
        R.F, // never fail by predicate
        R.identity, // do not transform rejected value
        () => {
          retriesCount += 1;
          return Promise.reject(retriesCount);
        }
      )();

      return result
        .then(() => {
          assert.fail('got resolved promise', 'expected rejected promise');
        })
        .catch(() => {
          assert.equal(retriesCount, retriesSchedule.length);
        });
    });
    it('should stop retrying if `stopFn` predicate returns true', () => {
      const retriesSchedule = [1, 1, 1, 1];
      let retriesCount = 0;

      const retryToStopOn = 2;

      const result = retryOrFail(
        retriesSchedule,
        () => retriesCount >= retryToStopOn,
        R.identity,
        () => {
          retriesCount += 1;
          return Promise.reject(retriesCount);
        }
      )();

      return result
        .then(() => {
          assert.fail('got resolved promise', 'expected rejected promise');
        })
        .catch(() => {
          assert.equal(retriesCount, retryToStopOn);
        });
    });
    it('should stop retrying after a successful try', () => {
      const retriesSchedule = [1, 1, 1, 1];
      let retriesCount = 0;

      const retryToSucceedOn = 2;

      const result = retryOrFail(retriesSchedule, R.F, R.identity, () => {
        retriesCount += 1;
        return retriesCount === retryToSucceedOn
          ? Promise.resolve(retriesCount)
          : Promise.reject(retriesCount);
      })();

      return result.then(() => {
        assert.equal(retriesCount, retryToSucceedOn);
      });
    });
  });
});
