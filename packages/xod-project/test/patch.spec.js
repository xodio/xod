import R from 'ramda';
import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';

import * as Patch from '../src/patch';

chai.use(dirtyChai);

describe('Patch', () => {
  describe('createPatch', () => {
    it('should return object', () => {
      expect(Patch.createPatch()).to.be.an('object');
    });
    it('should have key: path not empty', () => {
      const patch = Patch.createPatch('@/test');
      expect(patch)
        .to.have.property('path')
        .that.is.an('string')
        .that.not.empty();
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
        .that.is.an('object')
        .that.is.empty();
    });
  });

  describe('isPatchLocal', () => {
    const localPatch = Patch.createPatch('@/test');
    const libPatch = Patch.createPatch('vasya/superLibraru/test');

    console.log('>', localPatch);

    it('should return true for localPatch', () => {
      expect(Patch.isPatchLocal(localPatch)).to.be.true();
    });
    it('should return false for libPatch', () => {
      expect(Patch.isPatchLocal(libPatch)).to.be.false();
    });
  });

  describe('isPatchLibrary', () => {
    const localPatch = Patch.createPatch('@/test');
    const libPatch = Patch.createPatch('vasya/superLibraru/test');

    it('should return true for libPatch', () => {
      expect(Patch.isPatchLibrary(libPatch)).to.be.true();
    });
    it('should return false for localPatch', () => {
      expect(Patch.isPatchLibrary(localPatch)).to.be.false();
    });
  });
});
