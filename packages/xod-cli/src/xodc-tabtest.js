// xodc tabtest [--workspace=<dir>] <input> <path>
import path from 'path';
import os from 'os';
import * as R from 'ramda';
import fs from 'fs-extra';
import childProcess from 'child_process';

import { foldEither, allPromises } from 'xod-func-tools';
import { loadProject } from 'xod-fs';
import * as Tabtest from 'xod-tabtest';
import * as msg from './messageUtils';
import { getWorkspacePath } from './utils';

const bundledWorkspace = path.resolve(__dirname, '..');
const tabtestWorkspace = path.resolve(
  __dirname,
  '..',
  '..',
  'xod-tabtest',
  'workspace'
);

const tabtestSources = path.resolve(
  __dirname,
  '..',
  '..',
  'xod-tabtest',
  'cpp'
);

const catch2Sources = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'vendor',
  'catch2'
);

const showErrorAndExit = err => {
  msg.error(err);
  process.exit(1);
};

const spawn = (cmd, args, opts) =>
  new Promise((resolve, reject) => {
    childProcess.spawn(cmd, args, opts).on('exit', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${cmd} exited with code ${code}`));
      }
    });
  });

const tapProgress = note => R.tap(() => msg.notice(note));

export default (projectPath, patchPath, opts) => {
  const workspaces = [
    getWorkspacePath(opts.workspace),
    tabtestWorkspace,
    bundledWorkspace,
  ];

  const outDir = opts.outputDir || path.join(os.tmpdir(), 'xod-tabtest');
  const childProcessOpts = {
    stdio: 'inherit',
    shell: true,
    cwd: outDir,
  };

  const saveOutFile = ([filename, content]) =>
    fs.outputFile(path.join(outDir, filename), content);

  const generateSuite = project =>
    patchPath
      ? Tabtest.generatePatchSuite(project, patchPath)
      : Tabtest.generateProjectSuite(project);

  const build = () =>
    opts.noBuild
      ? Promise.resolve()
      : Promise.resolve()
          .then(tapProgress('Compiling...'))
          .then(() => spawn('make', [], childProcessOpts))
          .then(tapProgress('Testing...'))
          .then(() => spawn('make', ['test'], childProcessOpts));

  msg.notice(`Preparing test directory: ${outDir} ...`);

  fs
    .ensureDir(outDir)
    .then(tapProgress('Loading project...'))
    .then(() => loadProject(workspaces, projectPath))
    .then(tapProgress('Generating C++ code...'))
    .then(generateSuite)
    .then(foldEither(err => showErrorAndExit(err), R.identity))
    .then(R.toPairs)
    .then(tapProgress('Saving files...'))
    .then(R.map(saveOutFile))
    .then(R.append(fs.copy(tabtestSources, outDir)))
    .then(R.append(fs.copy(catch2Sources, outDir)))
    .then(allPromises)
    .then(build)
    .catch(showErrorAndExit);
};
