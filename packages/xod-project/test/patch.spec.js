import R from 'ramda';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import * as Patch from '../src/patch';

import { expectEither } from './helpers';

chai.use(dirtyChai);

describe('Patch', () => {
  // constructors
  describe('createPatch', () => {
    it('should return Patch that is an object', () => {
      const patch = Patch.createPatch();

      expect(patch).is.an('object');
    });
    it('should have key: nodes === {}', () => {
      const patch = Patch.createPatch('@/test');

      expect(patch)
        .to.have.property('nodes')
        .that.is.an('object')
        .that.is.empty();
    });
    it('should have key: links === []', () => {
      const patch = Patch.createPatch('@/test');

      expect(patch)
        .to.have.property('links')
        .that.is.an('array')
        .that.is.empty();
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
    it('should return Either.Right with valid patch', () => {
      const patch = { nodes: {}, links: {} };
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
});
