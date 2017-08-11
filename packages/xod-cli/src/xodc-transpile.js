// xodc transpile [--output=<filename>] [--target=<target>] <input> <path>

import fs from 'fs';
import path from 'path';
import { identity } from 'ramda';

import { foldEither } from 'xod-func-tools';
import { loadProject, readJSON, writeFile } from 'xod-fs';
import { transpileForArduino } from 'xod-arduino';
import * as msg from './messages';

const showErrorAndExit = (err) => {
  msg.error(err);
  process.exit(1);
};

export default (input, patchPath, program) => {
  const target = program.target;
  const output = program.output;
  const extension = path.extname(input);
  const filename = path.basename(input);

  const transpilers = {
    arduino: transpileForArduino,
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
      loadProject(dir)
        .then(resolve)
        .catch(reject);
    }

    if (!stat.isFile() && !isDirectory) {
      reject(new Error(`Unexpected input "${input}"`));
    }
  })
    .then(project => transpile(project, patchPath))
    .then(eitherCode =>
      foldEither(
        showErrorAndExit,
        identity,
        eitherCode
      )
    )
    .then((code) => {
      if (output) {
        return writeFile(output, code, 'utf8')
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
    .catch(showErrorAndExit);
};
