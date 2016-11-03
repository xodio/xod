// unpack <xodball> <workspace>   Unpack xodball into new project directory in the workspace

import path from 'path';
import { arrangeByFiles, save, readJSON } from 'xod-fs';
import * as msg from './messages';

export default (xodball, workspace) => {
  const xodballPath = path.resolve(xodball);
  const workspacePath = path.resolve(workspace);

  msg.notice(`Unpacking ${xodballPath}`);
  msg.notice(`into ${workspacePath}`);

  let projectName = 'Unknown project';

  readJSON(xodballPath)
    .then(project => { projectName = project.meta.name; return project; })
    .then(arrangeByFiles)
    .then(save(workspacePath))
    .then(() => {
      msg.success(`Project "${msg.bold(projectName)}" successfully unpacked!`);
      process.exit(0);
    })
    .catch(err => {
      msg.error(err);
      process.exit(1);
    });
};
