/* eslint-disable no-param-reassign */
import path from 'path';
import { exit } from 'process';
import { tmpdir } from 'os';
import { append, compose, identity, map, pick, toPairs } from 'ramda';
import fs from 'fs-extra';
import { flags } from '@oclif/command';

import childProcess from 'child_process';
import { createError, foldEither, allPromises } from 'xod-func-tools';
import { loadProject, resolvePath } from 'xod-fs';
import * as Tabtest from 'xod-tabtest';

import BaseCommand from '../baseCommand';
import * as commonArgs from '../args';
import * as myFlags from '../flags';
import { getListr } from '../listr';
import {
  resolveBundledCatch2Path,
  resolveBundledCatch2UtilsPath,
  resolveBundledTabtestSrcPath,
  resolveBundledTabtestWorkspacePath,
  resolveBundledWorkspacePath,
} from '../paths';

const defaultOutputDir = path.resolve(tmpdir(), 'xod-tabtest');

const spawn = (cmd, args, opts) =>
  new Promise((resolve, reject) => {
    childProcess.spawn(cmd, args, opts).on('exit', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(createError('TABTEST_PROCESS_NONZERO', { cmd, code }));
      }
    });
  });

class TabtestCommand extends BaseCommand {
  async run() {
    this.parseArgv(TabtestCommand);
    await this.ensureWorkspace();
    await this.parseEntrypoint();
    const {
      'no-build': noBuild,
      'output-dir': outDir,
      workspace,
      quiet,
    } = this.flags;
    const { projectPath, patchName } = this.args;

    const workspaces = [
      workspace,
      resolveBundledTabtestWorkspacePath(),
      resolveBundledWorkspacePath(),
    ];

    const loadProjectTask = {
      title: 'Loading project',
      task: ctx =>
        loadProject(workspaces, projectPath).then(project => {
          ctx.project = project;
          ctx.outDir =
            outDir === defaultOutputDir
              ? path.resolve(outDir, project.name)
              : outDir;
        }),
    };

    const prepareDirectoryTask = {
      title: 'Preparing directory',
      task: ctx =>
        fs
          .ensureDir(ctx.outDir)
          .then(
            () =>
              outDir === defaultOutputDir
                ? fs.emptyDir(ctx.outDir)
                : Promise.resolve()
          ),
    };

    const generateCppTask = {
      title: 'Generating C++ code',
      task: ctx => {
        ctx.pairs = compose(
          toPairs,
          foldEither(err => {
            throw err;
          }, identity)
        )(
          patchName
            ? Tabtest.generatePatchSuite(ctx.project, patchName)
            : Tabtest.generateProjectSuite(ctx.project)
        );
      },
    };

    const saveFilesTask = {
      title: 'Saving files',
      task: async ctx =>
        await compose(
          allPromises,
          append(fs.copy(resolveBundledTabtestSrcPath(), ctx.outDir)),
          append(fs.copy(resolveBundledCatch2Path(), ctx.outDir)),
          append(fs.copy(resolveBundledCatch2UtilsPath(), ctx.outDir)),
          map(([filename, content]) =>
            fs.outputFile(path.join(ctx.outDir, filename), content)
          )
        )(ctx.pairs),
    };

    await getListr(
      !quiet,
      [loadProjectTask, prepareDirectoryTask, generateCppTask, saveFilesTask],
      { collapse: false }
    )
      .run()
      .then(async ctx => {
        if (!noBuild) {
          const childProcessOpts = {
            stdio: quiet
              ? ['inherit', 'ignore', 'ignore']
              : ['inherit', 'inherit', 'inherit'],
            shell: true,
            cwd: ctx.outDir,
          };
          this.info('Compiling...');
          await spawn('make', [], childProcessOpts);
          this.info('Testing...');
          await spawn('make', ['test'], childProcessOpts);
        }
      })
      .then(() => exit(0))
      .catch(err => {
        this.printError(err);
        return exit(100);
      });
  }
}

TabtestCommand.description = 'tabtest project';

TabtestCommand.usage = 'tabtest [options] [entrypoint]';

TabtestCommand.flags = {
  ...BaseCommand.flags,
  ...pick(['workspace'], myFlags),
  'output-dir': flags.string({
    char: 'o',
    description: 'path to directory where to save tabtest data',
    env: 'XOD_OUTPUT',
    helpValue: 'path',
    default: defaultOutputDir,
    parse: p => resolvePath(p),
  }),
  'no-build': flags.boolean({
    description: 'do not build',
    default: false,
  }),
};

TabtestCommand.args = [commonArgs.entrypoint];

TabtestCommand.examples = [
  `Build tabtests for project in current working directory\n` +
    `$ xodc tabtest\n`,
  `Specify target directory and project, only generate tests\n` +
    `$ xodc tabtest --no-build --output-dir=/tmp/xod-tabtest ./workspace/__lib__/xod/net`,
];

TabtestCommand.strict = false;

export default TabtestCommand;
