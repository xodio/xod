import { expect } from 'chai';
import { Maybe, Either } from 'ramda-fantasy';

import { explode } from '../src/index';

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
