// xodc resave [--workspace=<workspace>] <input> <output>
import path from 'path';
import * as XF from 'xod-fs';

import { getWorkspacePath } from './utils';
import * as msg from './messageUtils';

const bundledWorkspace = path.resolve(__dirname, '..');

export default (input, output, workspace) => {
  const workspaces = [getWorkspacePath(workspace), bundledWorkspace];

  XF.loadProject(workspaces, input)
    .then(
      path.extname(output) === '.xodball'
        ? XF.saveProjectAsXodball(output)
        : XF.saveProjectEntirely(output)
    )
    .then(() => {
      msg.success(`Project resaved successfully into ${output}`);
      process.exit(0);
    })
    .catch(err => {
      msg.error(err);
      process.exit(1);
    });
};
