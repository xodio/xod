import chai, { expect, assert } from 'chai';
import dirtyChai from 'dirty-chai';

import * as CONST from '../src/constants';
import * as PatchPathUtils from '../src/patchPathUtils';

import * as Helper from './helpers';

chai.use(dirtyChai);

// Kludge to overwrite corrupted by dirtyChai asserts
// TODO: Remove dirtyChai ( https://github.com/xodio/xod/issues/1129 )
assert.isTrue = a => assert.equal(a, true);
assert.isFalse = a => assert.equal(a, false);

describe('PatchPathUtils', () => {
  describe('getBaseName', () => {
    it('should return base name extracted from path', () => {
      const baseName = 'test';
      const path = `@/folder/${baseName}`;
      const result = PatchPathUtils.getBaseName(path);
      expect(result).to.be.equal(baseName);
    });
  });

  describe('isValidIdentifier', () => {
    it('should ensure that Identifier is alphanumeric, in lowercase and kebabcase', () => {
      assert.isTrue(PatchPathUtils.isValidIdentifier('a'));
      assert.isTrue(PatchPathUtils.isValidIdentifier('1'));
      assert.isTrue(PatchPathUtils.isValidIdentifier('a-1'));
      assert.isTrue(PatchPathUtils.isValidIdentifier('1-a'));
      assert.isTrue(PatchPathUtils.isValidIdentifier('lower'));
      assert.isTrue(PatchPathUtils.isValidIdentifier('lower-kebab'));
      assert.isTrue(PatchPathUtils.isValidIdentifier('lower-kebab-123'));

      assert.isFalse(PatchPathUtils.isValidIdentifier(''));
      assert.isFalse(PatchPathUtils.isValidIdentifier('A'));
      assert.isFalse(PatchPathUtils.isValidIdentifier('@'));
      assert.isFalse(PatchPathUtils.isValidIdentifier('snake_case'));
      assert.isFalse(PatchPathUtils.isValidIdentifier('camelCase'));
      assert.isFalse(PatchPathUtils.isValidIdentifier('foo/bar'));
    });
    it('should ensure that Identifier does not start or end with hypen', () => {
      assert.isFalse(PatchPathUtils.isValidIdentifier('-'));
      assert.isFalse(PatchPathUtils.isValidIdentifier('-something'));
      assert.isFalse(PatchPathUtils.isValidIdentifier('something-'));
    });
    it('should ensure that Identifier does not contain more than one hypen in a row', () => {
      assert.isFalse(PatchPathUtils.isValidIdentifier('foo--bar'));
      assert.isFalse(PatchPathUtils.isValidIdentifier('foo---bar'));
    });
  });

  describe('isValidPatchBasename', () => {
    it('should ensure that PatchBasename is valid Identifier and could contain valid type specification', () => {
      // Valid common patch basenames
      assert.isTrue(PatchPathUtils.isValidPatchBasename('a'));
      assert.isTrue(PatchPathUtils.isValidPatchBasename('a-1'));
      assert.isTrue(PatchPathUtils.isValidPatchBasename('a-b'));
      assert.isTrue(PatchPathUtils.isValidPatchBasename('lower-kebab-123'));

      // Valid basenames with types
      assert.isTrue(PatchPathUtils.isValidPatchBasename('a(string)'));
      assert.isTrue(PatchPathUtils.isValidPatchBasename('a-b(string)'));
      assert.isTrue(PatchPathUtils.isValidPatchBasename('foo(string,number)'));
      assert.isTrue(
        PatchPathUtils.isValidPatchBasename('foo(super-string,number)')
      );

      // Invalid common patch basenames
      assert.isFalse(PatchPathUtils.isValidPatchBasename('-'));
      assert.isFalse(PatchPathUtils.isValidPatchBasename('a-'));
      assert.isFalse(PatchPathUtils.isValidPatchBasename('-a'));
      assert.isFalse(PatchPathUtils.isValidPatchBasename('foo--bar'));

      // Invalid basenames with types
      assert.isFalse(PatchPathUtils.isValidPatchBasename('a-(string)'));
      assert.isFalse(PatchPathUtils.isValidPatchBasename('a-string)'));
      assert.isFalse(PatchPathUtils.isValidPatchBasename('a(string'));
      assert.isFalse(PatchPathUtils.isValidPatchBasename('a(string,)'));
      assert.isFalse(PatchPathUtils.isValidPatchBasename('a(string)lala'));
      assert.isFalse(PatchPathUtils.isValidPatchBasename('a(string,number-)'));
      assert.isFalse(PatchPathUtils.isValidPatchBasename('a(string,-number)'));
      assert.isFalse(PatchPathUtils.isValidPatchBasename('foo--bar(string)'));
      assert.isFalse(PatchPathUtils.isValidPatchBasename('(string)'));
      assert.isFalse(PatchPathUtils.isValidPatchBasename('(string,number)'));
    });
  });
  describe('isValidPatchPath', () => {
    it('should accept local paths', () => {
      assert.isTrue(PatchPathUtils.isValidPatchPath('@/some-identifier'));

      assert.isFalse(PatchPathUtils.isValidPatchPath('@'));
      assert.isFalse(PatchPathUtils.isValidPatchPath('@/'));
      assert.isFalse(PatchPathUtils.isValidPatchPath('@/notAValidIdentifier'));
      assert.isFalse(
        PatchPathUtils.isValidPatchPath('@/not_a_valid_identifier')
      );
      assert.isFalse(PatchPathUtils.isValidPatchPath('@/extra/slashes'));
    });
    it('should accept local paths with types', () => {
      assert.isTrue(PatchPathUtils.isValidPatchPath('@/foo(string)'));
      assert.isTrue(PatchPathUtils.isValidPatchPath('@/foo(string,number)'));

      assert.isFalse(PatchPathUtils.isValidPatchPath('@(string)'));
      assert.isFalse(PatchPathUtils.isValidPatchPath('@/(string)'));
      assert.isFalse(PatchPathUtils.isValidPatchPath('@/AA(string)'));
      assert.isFalse(PatchPathUtils.isValidPatchPath('@/a(string,)'));
      assert.isFalse(PatchPathUtils.isValidPatchPath('@/a(string,'));
      assert.isFalse(PatchPathUtils.isValidPatchPath('@/a-(string)'));
      assert.isFalse(PatchPathUtils.isValidPatchPath('@/a-string)'));
      assert.isFalse(
        PatchPathUtils.isValidPatchPath('@/extra/slashes(string)')
      );
    });
    it('should accept library paths', () => {
      assert.isTrue(PatchPathUtils.isValidPatchPath('a/b/c'));
      assert.isTrue(
        PatchPathUtils.isValidPatchPath('author/lib-name/some-identifier')
      );

      assert.isFalse(PatchPathUtils.isValidPatchPath('//'));
      assert.isFalse(
        PatchPathUtils.isValidPatchPath(
          'invalid@author/lib-name/some-identifier'
        )
      );
      assert.isFalse(
        PatchPathUtils.isValidPatchPath(
          'author/@invalid@libname@/some-identifier'
        )
      );
      assert.isFalse(
        PatchPathUtils.isValidPatchPath('author/lib-name/invalid@identifier')
      );

      assert.isFalse(PatchPathUtils.isValidPatchPath('not-enough/slashes'));
      assert.isFalse(PatchPathUtils.isValidPatchPath('way/too/much/slashes'));
    });
    it('should accept library paths with types', () => {
      assert.isTrue(PatchPathUtils.isValidPatchPath('a/b/c(string)'));
      assert.isTrue(PatchPathUtils.isValidPatchPath('a/b/c(string,boolean)'));
      assert.isTrue(
        PatchPathUtils.isValidPatchPath('author/a-b/some-identifier(string)')
      );
      assert.isTrue(
        PatchPathUtils.isValidPatchPath('author/a-b/foo-bar(string,number)')
      );

      assert.isFalse(PatchPathUtils.isValidPatchPath('//(string)'));
      assert.isFalse(
        PatchPathUtils.isValidPatchPath(
          'author/lib-name/some-identifier-(string)'
        )
      );
      assert.isFalse(
        PatchPathUtils.isValidPatchPath(
          'author/lib-name/some-identifier(string,)'
        )
      );
      assert.isFalse(
        PatchPathUtils.isValidPatchPath(
          'author/lib-name/some-identifier(string'
        )
      );
      assert.isFalse(
        PatchPathUtils.isValidPatchPath(
          'author/lib-name/some-identifier-string)'
        )
      );
      assert.isFalse(
        PatchPathUtils.isValidPatchPath(
          'author/lib-name/some-identifier(string)lala'
        )
      );
      assert.isFalse(
        PatchPathUtils.isValidPatchPath(
          'invalid@author/lib-name/some-identifier(string)'
        )
      );
    });
  });

  describe('validatePath', () => {
    it('should be Either.Left for not valid paths', () => {
      const err1 = PatchPathUtils.validatePath('');
      const err2 = PatchPathUtils.validatePath('dots.in.names');

      assert.isTrue(PatchPathUtils.validatePath('кириллица').isLeft);
      assert.isTrue(PatchPathUtils.validatePath('spa ce').isLeft);
      assert.isTrue(PatchPathUtils.validatePath('spçiålÇhÅr$').isLeft);

      assert.isTrue(
        PatchPathUtils.validatePath('@/folder/subfolder/patchName').isLeft
      );
      assert.isTrue(
        PatchPathUtils.validatePath('@/patch_name_underscored').isLeft
      );

      Helper.expectEitherError(CONST.ERROR.PATH_INVALID, err1);
      Helper.expectEitherError(CONST.ERROR.PATH_INVALID, err2);
    });
    it('should be Either.Right for valid paths', () => {
      assert.isTrue(PatchPathUtils.validatePath('@/patch-name').isRight);
      assert.isTrue(
        PatchPathUtils.validatePath('author-name/library-name/patch-name')
          .isRight
      );
    });
    it('should be Either.Right should containt correct value', () => {
      const path = '@/patch-name';
      const result = PatchPathUtils.validatePath(path);
      assert.isTrue(result.isRight);

      /* istanbul ignore next */
      Helper.expectEitherRight(val => {
        expect(val).to.be.equal(path);
      }, result);
    });
  });

  describe('isPathLocal', () => {
    const localPath = '@/test';
    const libPath = 'vasya/super-library/test';

    it('should return true for localPath', () => {
      const result = PatchPathUtils.isPathLocal(localPath);
      expect(result).to.be.true();
    });
    it('should return false for not a path', () => {
      const result = PatchPathUtils.isPathLocal({});
      expect(result).to.be.false();
    });
    it('should return false for libPath', () => {
      const result = PatchPathUtils.isPathLocal(libPath);
      expect(result).to.be.false();
    });
  });
  describe('isPathLibrary', () => {
    const localPath = '@/test';
    const libPath = 'vasya/super-library/test';

    it('should return true for libPath', () => {
      const result = PatchPathUtils.isPathLibrary(libPath);
      expect(result).to.be.true();
    });
    it('should return false for not a path', () => {
      const result = PatchPathUtils.isPathLocal({});
      expect(result).to.be.false();
    });
    it('should return false for localPath', () => {
      const result = PatchPathUtils.isPathLibrary(localPath);
      expect(result).to.be.false();
    });
  });

  describe('getLibraryName', () => {
    const localPath = '@/test';
    const libName = 'vasya/super-library';
    const libPath = `${libName}/test`;

    it('should return library name for libPath', () => {
      const result = PatchPathUtils.getLibraryName(libPath);
      expect(result).to.be.equal(libName);
    });
    it('should return @ for localPath', () => {
      const result = PatchPathUtils.getLibraryName(localPath);
      expect(result).to.be.equal('@');
    });
  });

  describe('resolvePatchPath', () => {
    it('if both paths is local, it returns the same path', () => {
      assert.equal(
        PatchPathUtils.resolvePatchPath('@/local1', '@/local2'),
        '@/local1'
      );
    });
    it('if both paths is library, it returns the same path', () => {
      assert.equal(
        PatchPathUtils.resolvePatchPath(
          'xod/lib/local1',
          'xod/another-lib/local2'
        ),
        'xod/lib/local1'
      );
    });
    it('if first path is local, but second is libraty it should return new resolved path', () => {
      assert.equal(
        PatchPathUtils.resolvePatchPath('@/local1', 'xod/lib/local2'),
        'xod/lib/local1'
      );
    });
    it('if first path is library, but second is local it returns the same library path', () => {
      assert.equal(
        PatchPathUtils.resolvePatchPath('xod/lib/local1', '@/local2'),
        'xod/lib/local1'
      );
    });
  });
});
