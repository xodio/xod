import R from 'ramda';
import { Either } from 'ramda-fantasy';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import * as Helper from './helpers';

chai.use(dirtyChai);

describe('Helpers', () => {
  describe('expectEither', () => {
    const leftObj = { name: 'left' };
    const rightObj = { name: 'right' };

    // eslint-disable-next-line new-cap
    const left = Either.Left(leftObj);
    // eslint-disable-next-line new-cap
    const right = Either.Right(rightObj);

    it('should throw Left value', () => {
      const eitherLeft = () => Helper.expectEither(R.identity, left);
      expect(eitherLeft).to.throw(leftObj);
    });
    it('should return Right value', () => {
      Helper.expectEither(
        (val) => {
          expect(val).to.be.equal(rightObj);
        },
        right
      );
    });
  });
});
