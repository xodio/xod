// unpack <xodball> <workspace>   Unpack xodball into new project directory in the workspace

import path from 'path';
import { arrangeByFiles, save, readJSON } from 'xod-fs';
import { Spinner } from 'clui';
import * as msg from './messages';

export default (xodball, workspace) => {
  const xodballPath = path.resolve(xodball);
  const workspacePath = path.resolve(workspace);

  msg.notice(`Unpacking ${xodballPath}`);
  msg.notice(`into ${workspacePath}`);

  const spinner = new Spinner('Unpacking project...');
  spinner.start();

  let projectName = 'Unknown project';

  readJSON(xodballPath)
    .then(project => { projectName = project.meta.name; return project; })
    .then(arrangeByFiles)
    .then(save(workspacePath))
    .then(() => {
      spinner.stop();
      msg.success(`Project "${msg.bold(projectName)}" successfully unpacked!`);
      process.exit(1);
    })
    .catch(err => {
      spinner.stop();
      msg.error(`${msg.bold('Error')}: Can't unpack the project!`);
      msg.notice(err);
      process.exit(0);
    });
};
