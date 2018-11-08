import path from 'path';
import fs from 'fs-extra';
import { cwd, exit, stderr } from 'process';
import { cli } from 'cli-ux';
import chalk from 'chalk';
import Command from '@oclif/command';
import {
  allPass,
  complement,
  compose,
  cond,
  either,
  insert,
  isEmpty,
  isNil,
  join,
  mergeAll,
  pick,
  pipeP,
  startsWith,
  T,
  when,
} from 'ramda';
import {
  getPathToXodProject,
  isBasename,
  isWorkspaceValid,
  resolvePath,
  spawnWorkspaceFile,
} from 'xod-fs';
import * as xP from 'xod-project';
import * as xdb from 'xod-deploy-bin';
import { createError } from 'xod-func-tools';
import { resolveBundledWorkspacePath } from './paths';
import * as myFlags from './flags';
import localMsgs from './messages';

// convert (projectPath, patchPath) to patch name
const getPatchName = (projectPath, patchPath) =>
  cond([
    [isEmpty, () => null],
    [
      T,
      compose(
        name => `@/${name}`,
        when(isBasename('patch.xodp'), path.dirname)
      ),
    ],
  ])(path.relative(projectPath, patchPath));

// convert path to project/path and optional path name
// to full project path and patch name
const getProjectPathPatchName = (somePath, patch = null) => {
  const fullPath = resolvePath(somePath);
  return pipeP(
    p => fs.pathExists(p),
    exists =>
      exists
        ? getPathToXodProject(fullPath)
        : Promise.reject(
            createError('TRIED_TO_OPEN_NOT_XOD_FILE', {
              path: fullPath,
            })
          ),
    projectPath =>
      compose(
        patchName => ({
          projectPath,
          patchName,
        }),
        when(
          allPass([complement(isNil), complement(xP.isValidPatchPath)]),
          p => {
            throw createError('INVALID_PATCH_PATH', {
              patchPath: p,
            });
          }
        ),
        cond([
          [either(isEmpty, isNil), () => getPatchName(projectPath, fullPath)],
          [T, when(complement(startsWith('@/')), x => `@/${x}`)],
        ])
      )(patch)
  )(fullPath);
};

class BaseCommand extends Command {
  async init() {
    this.flags = {
      quiet: false,
    };
    this.args = {};
  }

  // print normal log message to stderr
  info(note) {
    if (!this.flags.quiet) stderr.write(`${note}\n`);
  }

  // print formatted error
  printError(err) {
    if (!this.flags.quiet) {
      // get formatter
      const defaultCode = 'UNKNOWN_ERROR';
      const f = compose(
        formatters => error =>
          formatters[error.type]
            ? formatters[error.type](error.payload)
            : formatters[defaultCode](error),
        mergeAll
      )([xP.messages, xdb.messages, localMsgs])(err);
      // template
      const msg = compose(
        join('\n'),
        insert(0, `🙈 ${chalk.black.bgRed.bold(f.title || 'Error')}`),
        when(() => f.note, insert(0, `📓 ${chalk.red(f.note)}`)),
        when(() => f.solution, insert(0, `${chalk.magenta(f.solution)}`))
      )([]);
      process.stderr.write(`\n${msg}\n`);
    }
  }

  // parse flags and args
  parseArgv(cls) {
    const parsed = this.parse(cls);
    this.argv = parsed.argv;
    this.args = parsed.args;
    this.flags = parsed.flags;
  }

  // parse argv to projectPath and patchName
  async parseEntrypoint(argvs) {
    const argv = argvs || this.argv;
    await getProjectPathPatchName(argv[0] || cwd(), argv[1] || null)
      .then(result => {
        this.args.projectPath = result.projectPath;
        this.args.patchName = result.patchName;
      })
      .catch(err => {
        this.printError(err);
        return exit(255);
      });
  }

  // ensure workspace
  async ensureWorkspace(wPath) {
    const targetPath = resolvePath(wPath || this.flags.workspace);

    this.flags.workspace = await isWorkspaceValid(targetPath).catch(async e => {
      switch (e.errorCode) {
        case 'WORKSPACE_DIR_NOT_EXIST_OR_EMPTY':
          return spawnWorkspaceFile(e.path);
        default:
          this.printError(e);
          return exit(254);
      }
    });
    await xdb.prepareWorkspacePackagesDir(
      resolveBundledWorkspacePath(),
      this.flags.workspace
    );
    return this.flags.workspace;
  }

  // prompt for username and password if needed and patch flags
  async getCredentials() {
    this.flags.username =
      this.flags.username || (await cli.prompt('XOD API Username'));
    this.flags.password =
      this.flags.password ||
      (await cli.prompt('XOD API Password', { type: 'hide' }));
  }
}

BaseCommand.flags = pick(['help', 'version', 'quiet', 'workspace'], myFlags);

export default BaseCommand;
