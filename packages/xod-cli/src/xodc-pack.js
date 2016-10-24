// pack <projectDir> <output>   Pack project directory into xodball
/* eslint-disable no-console */

import path from 'path';
import fs from 'fs';
import { loadProjectWithLibs, pack } from 'xod-fs';
import { Spinner } from 'clui';

export default (projectDir, output) => {
  const projectPath = path.resolve(projectDir);
  const workspace = path.resolve(projectDir, '..');
  const dirName = projectDir.split('/').pop();

  console.log(`Packing ${dirName} into ${output}`);

  const spinner = new Spinner('Packing project...');

  spinner.start();

  loadProjectWithLibs(projectPath, workspace)
    .then(({ project, libs }) => pack(project, libs))
    .then(packed => fs.writeFile(output, JSON.stringify(packed, undefined, 2), 'utf8', err => {
      if (err) { throw err; }

      spinner.stop();
      console.log(`Packed project successfully written into ${output}.`);
    }))
    .catch(err => {
      spinner.stop();
      console.error(err);
      process.exit(0);
    });
};
