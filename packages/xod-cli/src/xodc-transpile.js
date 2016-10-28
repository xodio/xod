// transpile|t <input>                 Transpile code
// -t --target [espruino|arduino]      Transpile code for target device (espruino by default).
// -o --output [filename.txt]          Output result into file (or stdout by default).

/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';
import { loadProjectWithLibs, pack, writeJSON, readJSON } from 'xod-fs';
import { transpile, runtime } from 'xod-espruino';
import { Spinner } from 'clui';
import * as msg from './messages';

export default (input, program) => {
  const target = program.target;
  const output = program.output;
  const extension = path.extname(input);
  const filename = path.basename(input);

  msg.notice(`Transpiling ${filename} for ${msg.bold(target)}`);

  const spinner = new Spinner('Transpiling code...');
  spinner.start();

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
      reject(new Error(`Can't transpile it: unknown type of input "${input}".`));
    }
  })
    .then(project => transpile({ project, runtime }))
    .then(code => {
      spinner.stop();
      if (output) {
        return writeJSON(output, code)
          .then(() => {
            msg.success(`Result has been wrote into ${output} file.`);
          })
          .catch(err => {
            msg.error(`Error: Can't write result into ${output} file.`);
            msg.notice(err);
          });
      }

      process.stdout.write(code);
      process.exit(1);
      return code;
    })
    .catch(err => {
      spinner.stop();
      msg.error('Error: Can\'t transpile code!');
      msg.notice(err);
    });
};
