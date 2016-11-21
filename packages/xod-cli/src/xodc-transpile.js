// transpile|t <input>                    Transpile code
// -t --target [espruino|arduino|nodejs]  Transpile code for target device (espruino by default).
// -o --output [filename.txt]             Output result into file (or stdout by default).

/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';
import { loadProjectWithLibs, pack, readJSON, writeFile } from 'xod-fs';
import { transpileForEspruino, transpileForNodeJS } from 'xod-js';
import * as msg from './messages';

export default (input, program) => {
  const target = program.target;
  const output = program.output;
  const extension = path.extname(input);
  const filename = path.basename(input);

  let transpile = transpileForEspruino;
  switch (target) {
    case 'nodejs':
      transpile = transpileForNodeJS;
      break;
    case 'arduino':
      throw new Error('There is no transpiler for arduino yet!');
    default:
    case 'espruino':
      transpile = transpileForEspruino;
      break;
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
    .then(project => transpile(project))
    .then(code => {
      if (output) {
        return writeFile(output, code)
          .then(() => {
            msg.success(`Successfully transpiled to ${output}`);
          })
          .catch(err => {
            msg.error(err);
          });
      }

      msg.success('Successfully transpiled');
      process.stdout.write(code);
      process.exit(0);
      return code;
    })
    .catch(err => {
      msg.error(err);
      process.exit(1);
    });
};
