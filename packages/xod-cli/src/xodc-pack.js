// pack <projectDir> <output>   Pack project directory into xodball
/* eslint-disable no-console */

import path from 'path';
import { loadProjectWithLibs, pack, writeJSON } from 'xod-fs';
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
    .then(packed =>
      writeJSON(output, packed)
        .then(() => {
          spinner.stop();
          console.log(`Packed project successfully written into ${output}.`);
        })
    )
    .catch(err => {
      spinner.stop();
      console.error(err);
      process.exit(0);
    });
};
