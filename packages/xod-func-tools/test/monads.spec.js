import { assert } from 'chai';
import { identity, F } from 'ramda';
import { Maybe, Either } from 'ramda-fantasy';

import {
  explode,
  explodeMaybe,
  explodeEither,
  foldEither,
  foldMaybe,
  foldMaybeWith,
  catMaybies,
  eitherToPromise,
  maybeToPromise,
  reduceEither,
  reduceMaybe,
  leftIf,
} from '../src/monads';

describe('moands', () => {
  describe('explode()', () => {
    it('should return Maybe.Just value', () => {
      assert.equal(explode(Maybe.Just(25)), 25);
    });
    it('should throw error for Maybe.Nothing', () => {
      assert.throws(() => explode(Maybe.Nothing()), Error);
    });
    it('should return Either.Right value', () => {
      assert.equal(explode(Either.Right(25)), 25);
    });
    it('should throw error for Either.Left', () => {
      assert.throws(() => explode(Either.Left('err')), Error);
    });
    it('should throw error if its not Maybe or Either', () => {
      assert.throws(() => explode(5), Error);
    });
  });
  describe('explodeMaybe()', () => {
    it('should return value for Just', () => {
      assert.equal(explodeMaybe('err', Maybe.Just('correct')), 'correct');
    });
    it('should throw an error for Nothing', () => {
      assert.throws(() => explodeMaybe('err', Maybe.Nothing()), Error);
    });
  });
  describe('explodeEither()', () => {
    it('should return value for Right', () => {
      assert.equal(explodeEither(Either.Right('correct')), 'correct');
    });
    it('should throw an error for Left', () => {
      assert.throws(() => explodeEither(Either.Left('not correct')), Error);
    });
  });

  describe('foldEither()', () => {
    it('should return Left value for Left', () => {
      assert.equal(foldEither(identity, F, Either.Left('left')), 'left');
    });
    it('should return Right value for Right', () => {
      assert.equal(foldEither(F, identity, Either.Right('right')), 'right');
    });
  });
  describe('foldMaybe()', () => {
    it('should return specified value for Nothing', () => {
      assert.equal(foldMaybe(42, F, Maybe.Nothing()), 42);
    });
    it('should return a value for Just', () => {
      assert.equal(
        foldMaybe('not works', identity, Maybe.Just('it works')),
        'it works'
      );
    });
  });
  describe('foldMaybeWith()', () => {
    it('should return function result for Nothing', () => {
      assert.equal(foldMaybeWith(() => 42, () => null, Maybe.Nothing()), 42);
    });
    it('should return function result for Just', () => {
      assert.equal(foldMaybeWith(() => null, a => a, Maybe.Just(42)), 42);
    });
    it('should not call function for Nothing when Maybe is Just', () => {
      let called = false;

      assert.equal(
        foldMaybeWith(
          () => {
            called = true;
          },
          a => a,
          Maybe.Just(42)
        ),
        42
      );

      assert.isFalse(called);
    });
  });

  describe('catMaybies()', () => {
    it('should return list of unwrapped Justs', () => {
      assert.sameMembers(
        catMaybies([Maybe.Just(32), Maybe.Just(83), Maybe.Nothing()]),
        [32, 83]
      );
    });
  });

  describe('eitherToPromise()', () => {
    it('returns resolved promise contained Right value', () =>
      eitherToPromise(Either.Right(52)).then(val => assert.equal(val, 52)));
    it('returns rejected promise contained Left value', () =>
      eitherToPromise(Either.Left('err')).catch(val =>
        assert.equal(val, 'err')
      ));
  });

  describe('maybeToPromise()', () => {
    it('returns resolved promise contained Just value', () =>
      maybeToPromise(
        () => assert.fail('', '', 'This function should not been called!'),
        a => a + 5,
        Maybe.Just(52)
      ).then(val => assert.equal(val, 57)));
    it('returns rejected promise', () =>
      maybeToPromise(
        () => new Error('It is Nothing!'),
        a => assert.fail(a, undefined, 'This function should not been called!'),
        Maybe.Nothing()
      ).catch(err => {
        assert.instanceOf(err, Error);
        assert.equal(err.message, 'It is Nothing!');
      }));
    it('returns rejected promise without nesting', () =>
      maybeToPromise(
        () => Promise.reject(new Error('It is Nothing!')),
        a => assert.fail(a, undefined, 'This function should not been called!'),
        Maybe.Nothing()
      ).catch(err => {
        assert.instanceOf(err, Error);
        assert.equal(err.message, 'It is Nothing!');
      }));
  });

  describe('reduceEither()', () => {
    it('should return reduced list wrapped in the Either.Right', () => {
      const iterator = (acc, a) => Either.Right([...acc, a]);
      const res = reduceEither(iterator, ['d', 'e'], ['a', 'b', 'c']);

      assert.isTrue(res.isRight);
      assert.sameMembers(explodeEither(res), ['d', 'e', 'a', 'b', 'c']);
    });
    it('should return Either.Left if iterator returned Either.Left at least one time', () => {
      const iterator = (acc, a) =>
        a === 'b' ? Either.Left('err') : Either.Right([...acc, a]);
      const res = reduceEither(iterator, ['d', 'e'], ['a', 'b', 'c']);

      assert.isTrue(res.isLeft);
      assert.throws(() => explodeEither(res), Error);
    });
  });

  describe('reduceMaybe()', () => {
    it('should return reduced list wrapped in the Maybe.Just', () => {
      const iterator = (acc, a) => Maybe.Just([...acc, a]);
      const res = reduceMaybe(iterator, ['d', 'e'], ['a', 'b', 'c']);

      assert.isTrue(res.isJust);
      assert.sameMembers(explodeMaybe('err', res), ['d', 'e', 'a', 'b', 'c']);
    });
    it('should return Maybe.Nothing if iterator returned Maybe.Nothing at least one time', () => {
      const iterator = (acc, a) =>
        a === 'b' ? Maybe.Nothing() : Maybe.Just([...acc, a]);
      const res = reduceMaybe(iterator, ['d', 'e'], ['a', 'b', 'c']);

      assert.isTrue(res.isNothing);
      assert.throws(() => explodeMaybe('err', res), Error);
    });

    describe('leftIf()', () => {
      const validateMoreThan5 = leftIf(x => x > 5, x => `${x} less than 5`);

      it('returns Either.Right 5 for truthy condition', () => {
        const res = validateMoreThan5(6);
        assert.equal(res.isRight, true);
        assert.equal(explodeEither(res), 6);
      });
      it('returns Either.Left String for falsy condition', () => {
        const res = validateMoreThan5(3);
        assert.equal(res.isLeft, true);
        assert.equal(foldEither(identity, identity, res), '3 less than 5');
      });
    });
  });
});
