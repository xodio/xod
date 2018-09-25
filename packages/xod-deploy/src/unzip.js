import path from 'path';
import extractZip from 'extract-zip';

// TODO: Add unpack functions for other archives

/**
 * Unpacks zip in the same directory.
 * Returns `Promise` with the name of the unpacked root directory.
 * E.G.
 * 1. We downloaded "my-lib.zip".
 *    And it has an "awe$ome-library" directory in the root.
 * 2. Called `unpackZip('/my/path/my-lib.zip')`.
 *    It unpacked archive into `/my/path/awe$ome-library/`.
 *    And returned Promise with `awe$some-library/`.
 * 3. Then we can do something with this directory on next steps.
 *    E.G. rename to the normalized name.
 *
 * :: Path -> Promise Path Error
 */
export default filePath =>
  new Promise((resolve, reject) => {
    let originalRootDirName = null;
    extractZip(
      filePath,
      {
        dir: path.dirname(filePath),
        onEntry: entry => {
          // It reads zip from the beggining, so first entry will be
          // the root directory (if archive contains root directory).
          // But our archives have root directory now.
          // We store it into a variable to rename it later.
          // TODO: Make it more solid
          if (originalRootDirName) return;
          originalRootDirName = path.basename(entry.fileName);
        },
      },
      err => {
        if (err) return reject(err);
        return resolve(originalRootDirName);
      }
    );
  });
