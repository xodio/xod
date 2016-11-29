import R from 'ramda';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import * as Patch from '../src/patch';

import { expectEither } from './helpers';

chai.use(dirtyChai);

describe('Patch', () => {
  describe('createPatch', () => {
    it('should return Either.Left for non-valid path argument', () => {
      expect(Patch.createPatch().isLeft).to.be.true();
      expect(Patch.createPatch('').isLeft).to.be.true();
      expect(Patch.createPatch('$p∑çiål ÇhÅr$').isLeft).to.be.true();
    });
    it('should return Either.Right for valid path argument', () => {
      expect(Patch.createPatch('@/test').isRight).to.be.true();
      expect(Patch.createPatch('external/library/test').isRight).to.be.true();
    });
    it('should return Either.Right that have a key "path", that not empty', () => {
      const right = Patch.createPatch('@/test');

      expectEither(
        (patch) => {
          expect(patch)
            .to.have.property('path')
            .that.is.a('string')
            .that.not.empty();
        },
        right
      );
    });
    it('should have key: nodes === {}', () => {
      const right = Patch.createPatch('@/test');

      expectEither(
        (patch) => {
          expect(patch)
            .to.have.property('nodes')
            .that.is.an('object')
            .that.is.empty();
        },
        right
      );
    });
    it('should have key: links === []', () => {
      const right = Patch.createPatch('@/test');

      expectEither(
        (patch) => {
          expect(patch)
            .to.have.property('links')
            .that.is.an('array')
            .that.is.empty();
        },
        right
      );
    });
  });

  describe('getPatchPath', () => {
    it('should return Either.Left for empty object', () => {
      const result = Patch.getPatchPath({});
      expect(result.isLeft).to.be.true();
    });
    it('should return Either.Right for correct patch', () => {
      const path = '@/test';
      const patch = { path };
      const result = Patch.getPatchPath(patch);
      expect(result.isRight).to.be.true();

      /* istanbul ignore next */
      expectEither(
        (val) => { expect(val).to.be.equal(path); },
        result
      );
    });
  });

  describe('isPatchLocal', () => {
    const localPath = '@/test';
    const libPath = 'vasya/superLibraru/test';
    const localPatch = { path: localPath };
    const libPatch = { path: libPath };

    it('should return null for not-a-patch', () => {
      expect(Patch.isPatchLocal({}).isLeft).to.be.true();
    });
    it('should return true for localPatch', () => {
      const result = Patch.isPatchLocal(localPatch);
      expect(result.isRight).to.be.true();

      /* istanbul ignore next */
      expectEither(
        (val) => { expect(val).to.be.true(); },
        result
      );
    });
    it('should return false for libPatch', () => {
      const result = Patch.isPatchLocal(libPatch);
      expect(result.isRight).to.be.true();

      /* istanbul ignore next */
      expectEither(
        (val) => { expect(val).to.be.false(); },
        result
      );
    });
  });

  describe('isPatchLibrary', () => {
    const localPath = '@/test';
    const libPath = 'vasya/superLibraru/test';
    const localPatch = { path: localPath };
    const libPatch = { path: libPath };

    it('should return null for not-a-patch', () => {
      expect(Patch.isPatchLibrary({}).isLeft).to.be.true();
    });
    it('should return true for libPatch', () => {
      const result = Patch.isPatchLibrary(libPatch);
      expect(result.isRight).to.be.true();

      /* istanbul ignore next */
      expectEither(
        (val) => { expect(val).to.be.true(); },
        result
      );
    });
    it('should return false for localPatch', () => {
      const result = Patch.isPatchLibrary(localPatch);
      expect(result.isRight).to.be.true();

      /* istanbul ignore next */
      expectEither(
        (val) => { expect(val).to.be.false(); },
        result
      );
    });
  });
});
