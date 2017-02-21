// transpile|t <input> <patchPath>        Transpile code
// -t --target [espruino|arduino|nodejs]  Transpile code for target device (espruino by default).
// -o --output [filename.txt]             Output result into file (or stdout by default).

/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';
import { loadProjectWithLibs, pack, readJSON, writeFile } from 'xod-fs';
import { transpileForEspruino, transpileForNodeJS } from 'xod-js';
import * as msg from './messages';

export default (input, patchPath, program) => {
  const target = program.target;
  const output = program.output;
  const extension = path.extname(input);
  const filename = path.basename(input);

  const transpilers = {
    nodejs: transpileForNodeJS,
    espruino: transpileForEspruino,
  };

  const transpile = transpilers[target];
  if (!transpile) {
    throw new Error(`Unknown target "${target}". Supported targets are: ${Object.keys(transpilers)}`);
  }

  msg.notice(`Transpiling ${filename} for ${target} ...`);

  new Promise((resolve, reject) => {
    const stat = fs.statSync(input);
    let isDirectory = stat.isDirectory();
    let dir = path.resolve(input);

    if (stat.isFile()) {
      if (extension === '.xodball') {
        readJSON(input)
          .then(resolve)
          .catch(reject);
      }
      if (filename === 'project.xod') {
        dir = path.dirname(dir);
        isDirectory = true;
      }
    }

    if (isDirectory) {
      loadProjectWithLibs(dir, path.resolve(dir, '..'))
        .then(({ project, libs }) => pack(project, libs))
        .then(resolve)
        .catch(reject);
    }

    if (!stat.isFile() && !isDirectory) {
      reject(new Error(`Unexpected input "${input}"`));
    }
  })
    .then(project => transpile(project, patchPath))
    .then((code) => {
      if (output) {
        return writeFile(output, code)
          .then(() => {
            msg.success(`Successfully transpiled to ${output}`);
          })
          .catch((err) => {
            msg.error(err);
          });
      }

      msg.success('Successfully transpiled');
      process.stdout.write(code);
      process.exit(0);
      return code;
    })
    .catch((err) => {
      msg.error(err);
      process.exit(1);
    });
};
