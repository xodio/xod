import path from 'path';
import * as R from 'ramda';
import * as fse from 'fs-extra';
import chai, { assert } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiFs from 'chai-fs';

import {
  checkLibrariesInstalledByUrls,
  installLibrariesByUrls,
} from '../src/libraryManager';

chai.use(chaiAsPromised);
chai.use(chaiFs);

describe('Library Manager', () => {
  let progress = [];
  const onProgress = data => {
    progress = R.append(data, progress);
  };

  beforeEach(() => {
    progress = [];
  });

  describe('checkLibrariesInstalled()', () => {
    it('returns resolved Promise with results indexed by url', () => {
      const res = checkLibrariesInstalledByUrls(
        onProgress,
        path.resolve(__dirname, '..'),
        [
          'https://github.com/pseudo-lib-names-as-directories/src',
          'https://github.com/i-hope-there/will-be-no-such-dir',
        ]
      );

      return Promise.all([
        assert.eventually.deepEqual(res, {
          'https://github.com/pseudo-lib-names-as-directories/src': true,
          'https://github.com/i-hope-there/will-be-no-such-dir': false,
        }),
        res.then(() => {
          assert.lengthOf(progress, 2);

          const progressNotes = R.map(R.prop('note'), progress);
          assert.sameMembers(progressNotes, [
            'Library "src" already installed',
            'Library "will_be_no_such_dir" is missing',
          ]);

          const missingLibEntry = R.find(
            R.propEq('note', 'Library "will_be_no_such_dir" is missing'),
            progress
          );
          assert.isObject(missingLibEntry);
          assert.strictEqual(missingLibEntry.percentage, 1);
        }),
      ]);
    });
    it('returns rejected Promise for invalid url (cant get name)', () => {
      const res = checkLibrariesInstalledByUrls(
        onProgress,
        path.resolve(__dirname, '..'),
        ['https://github.com/valid/name', 'https://bitbucket.org/invalid-name']
      );
      return Promise.all([
        assert.isRejected(
          res,
          'CANT_GET_LIBRARY_NAME {"url":"https://bitbucket.org/invalid-name"}'
        ),
        // Progress is empty, cause error occured faster than checked another library
        res.catch(() => assert.lengthOf(progress, 0)),
      ]);
    });
  });

  describe('installLibrariesByUrls()', () => {
    const tmpDir = path.resolve(__dirname, 'tmp');
    afterEach(() => fse.remove(tmpDir));
    it('returns Promise with Array of installed library names', () => {
      const res = installLibrariesByUrls(onProgress, tmpDir, [
        'https://github.com/arduino-libraries/GSM',
        'https://github.com/arduino-libraries/UnoWiFi-Developer-Edition-Lib/',
        'https://github.com/z3t0/Arduino-IRremote',
      ]);
      return Promise.all([
        // Check Promise contents
        res.then(libs =>
          assert.sameMembers(libs, [
            'GSM',
            'UnoWiFi_Developer_Edition_Lib',
            'Arduino_IRremote',
          ])
        ),
        // Check that directories exists and not empty
        res.then(
          R.tap(
            R.map(
              R.pipe(x => path.resolve(tmpDir, x), assert.notIsEmptyDirectory)
            )
          )
        ),
        // Check that no .zips are left
        res.then(
          R.tap(
            R.map(
              R.pipe(
                x => path.resolve(tmpDir, `${x}.zip`),
                assert.notPathExists
              )
            )
          )
        ),
        // Check progress
        res.then(() => {
          assert.lengthOf(progress, 9);
          assert.equal(progress[3].percentage, 0.44);
          assert.equal(progress[5].percentage, 0.67);
          assert.equal(progress[8].percentage, 1);
        }),
      ]);
    });
  });
});
