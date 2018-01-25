// xodc transpile [--output=<filename>] [--workspace=<dir>] <input> <path>
import path from 'path';
import { map, identity } from 'ramda';

import { foldEither } from 'xod-func-tools';
import { loadProject, writeFile } from 'xod-fs';
import { transformProject, transpile } from 'xod-arduino';
import * as msg from './messageUtils';
import { getWorkspacePath } from './utils';

const bundledWorkspace = path.resolve(__dirname, '..');

const showErrorAndExit = (err) => {
  msg.error(err);
  process.exit(1);
};

export default (input, patchPath, program) => {
  const output = program.output;
  const workspaces = [getWorkspacePath(program.workspace), bundledWorkspace];
  const filename = path.basename(input);
  msg.notice(`Transpiling ${filename} ...`);

  loadProject(workspaces, input)
    .then(project => transformProject(project, patchPath))
    .then(map(transpile))
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
