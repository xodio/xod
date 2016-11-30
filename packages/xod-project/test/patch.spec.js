import R from 'ramda';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import * as Patch from '../src/patch';

import { expectEither } from './helpers';

chai.use(dirtyChai);

describe('Patch', () => {
  // constructors
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
  describe('duplicatePatch', () => {
    const patch = { path: '@/test' };
    it('should return Either.Left for wrong path', () => {
      const newPatch = Patch.duplicatePatch('@/te $t', patch);
      expect(newPatch.isLeft).to.be.true();
    });
    it('should return Either.Right for correct path', () => {
      const newPath = '@/test2';
      const newPatch = Patch.duplicatePatch(newPath, patch);
      expect(newPatch.isRight).to.be.true();

      /* istanbul ignore next */
      expectEither(
        right => {
          expect(right).to.be.an('object');
          expect(right.path).to.be.equal(newPath);
        },
        newPatch
      );
    });
  });

  // properties
  describe('getPatchPath', () => {
    it('should return patch path', () => {
      const path = '@/test';
      const patch = { path };
      const result = Patch.getPatchPath(patch);
      expect(result).to.be.equal(path);
    });
  });
  describe('getPatchBaseName', () => {
    it('should return base name extracted from path', () => {
      const baseName = 'test';
      const path = `@/folder/${baseName}`;
      const patch = { path };
      const result = Patch.getPatchBaseName(patch);
      expect(result).to.be.equal(baseName);
    });
  });
  describe('getPatchLabel', () => {
    it('should return empty String for empty patch object', () => {
      expect(Patch.getPatchLabel({})).to.be.equal('');
    });
    it('should return patch label', () => {
      const label = 'patchLabel';
      expect(Patch.getPatchLabel({ label })).to.be.equal(label);
    });
  });
  describe('setPatchLabel', () => {
    it('should return patch with new label', () => {
      const newLabel = 'new label';
      const patch = { label: 'old label' };
      const newPatch = Patch.setPatchLabel(newLabel, patch);

      expect(newPatch)
        .to.have.property('label')
        .that.is.a('string')
        .that.equals(newLabel);
    });
    it('should always set a string to label', () => {
      expect(Patch.setPatchLabel('test', {}))
        .to.have.property('label')
        .that.equals('test');
      expect(Patch.setPatchLabel(5, {}))
        .to.have.property('label')
        .that.equals('5');
      expect(Patch.setPatchLabel([1, 2], {}))
        .to.have.property('label')
        .that.equals('1,2');
      expect(Patch.setPatchLabel({}, {}))
        .to.have.property('label')
        .that.equals('[object Object]');
    });
  });

  // entity getters

  // entity setters

  // validations
  describe('validatePatch', () => {
    it('should return Either.Left for empty object', () => {
      const patch = Patch.validatePatch({});
      expect(patch.isLeft).to.be.true();
    });
    it('should return Either.Left for invalid path', () => {
      const patch = Patch.validatePatch({ path: 'in√ål;d pÅth' });
      expect(patch.isLeft).to.be.true();
    });
    it('should return Either.Right with valid patch', () => {
      const path = '@/valid';
      const patch = { path };
      const test = Patch.validatePatch(patch);
      expect(test.isRight).to.be.true();

      /* istanbul ignore next */
      expectEither(
        rightPatch => { expect(rightPatch).to.be.equal(patch); },
        test
      );
    });
  });

  // etc
  describe('isPatchLocal', () => {
    const localPath = '@/test';
    const libPath = 'vasya/superLibraru/test';
    const localPatch = { path: localPath };
    const libPatch = { path: libPath };

    it('should return true for localPatch', () => {
      const result = Patch.isPatchLocal(localPatch);
      expect(result).to.be.true();
    });
    it('should return false for not a patch', () => {
      const result = Patch.isPatchLocal({});
      expect(result).to.be.false();
    });
    it('should return false for libPatch', () => {
      const result = Patch.isPatchLocal(libPatch);
      expect(result).to.be.false();
    });
  });
  describe('isPatchLibrary', () => {
    const localPath = '@/test';
    const libPath = 'vasya/superLibraru/test';
    const localPatch = { path: localPath };
    const libPatch = { path: libPath };

    it('should return true for libPatch', () => {
      const result = Patch.isPatchLibrary(libPatch);
      expect(result).to.be.true();
    });
    it('should return false for not a patch', () => {
      const result = Patch.isPatchLocal({});
      expect(result).to.be.false();
    });
    it('should return false for localPatch', () => {
      const result = Patch.isPatchLibrary(localPatch);
      expect(result).to.be.false();
    });
  });
});
