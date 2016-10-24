// unpack <xodball> <workspace>   Unpack xodball into new project directory in the workspace
/* eslint-disable no-console */

import path from 'path';
import fs from 'fs';
import { arrangeByFiles, save } from 'xod-fs';
import { Spinner } from 'clui';

export default (xodball, workspace) => {
  const xodballPath = path.resolve(xodball);
  const workspacePath = path.resolve(workspace);

  console.log(`Unpacking ${xodballPath} into ${workspacePath}`);

  const spinner = new Spinner('Packing project...');
  spinner.start();

  try {
    fs.readFile(xodballPath, 'utf8', (err, data) => {
      if (err) { throw err; }

      const json = JSON.parse(data);
      const unpacked = arrangeByFiles(json);
      const projectName = json.meta.name;

      save(
        unpacked,
        workspacePath,
        () => {
          spinner.stop();
          console.log(`Project "${projectName}" successfully unpacked!`);
        },
        saveError => { throw saveError; }
      );
    });
  } catch (err) {
    spinner.stop();
    console.error(err);
    process.exit(0);
  }
};
