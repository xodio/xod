/* eslint-disable no-param-reassign */
import { cwd, exit } from 'process';
import path from 'path';
import { dropLast, last, lensProp, when, over, pick } from 'ramda';
import fs from 'fs-extra';
import chalk from 'chalk';
import { flags } from '@oclif/command';
import { resolvePath } from 'xod-fs';
import * as xdb from 'xod-deploy-bin';
import BaseCommand from '../baseCommand';
import * as commonArgs from '../args';
import * as myFlags from '../flags';
import { getListr } from '../listr';
import {
  checkBoardTask,
  loadProjectTask,
  transformTask,
  transpileTask,
} from '../listrTasks';
import { resolveBundledWorkspacePath } from '../paths';

class CompileCommand extends BaseCommand {
  async run() {
    this.parseArgv(CompileCommand);
    await this.ensureWorkspace();
    await this.parseEntrypoint();
    const { board, debug, workspace, quiet } = this.flags;
    const output = resolvePath(this.flags.output || cwd());
    const { projectPath } = this.args;
    const patchName = this.args.patchName || '@/main';

    // accumulate arduino-cli messages to this variable
    const messages = [];

    const initTask = {
      title: 'Initialize',
      task: async ctx => {
        await fs.ensureDir(output);
        ctx.sketchDir = await xdb.prepareSketchDir();
        ctx.arduinoCli = await xdb.createCli(
          resolveBundledWorkspacePath(),
          workspace,
          ctx.sketchDir
        );
      },
    };

    await getListr(
      !quiet,
      [
        initTask,
        checkBoardTask(workspace, board),
        loadProjectTask(
          [workspace, resolveBundledWorkspacePath()],
          projectPath
        ),
        transformTask(patchName, debug),
        transpileTask(),
        { title: 'Compiling', task: () => Promise.resolve() },
      ],
      { collapse: false }
    )
      .run()
      .then(async ctx => {
        const payloadWithUpdatedFqbn = over(
          lensProp('board'),
          xdb.patchFqbnWithOptions,
          {
            code: ctx.transpile,
            wsBundledPath: resolveBundledWorkspacePath(),
            ws: workspace,
            board: ctx.board,
          }
        );
        const { sketchName } = await xdb.compile(
          ({ message }) => {
            if (
              message !== '' &&
              message !== null &&
              message !== last(messages)
            ) {
              messages.push(when(m => last(m) === '\n', dropLast(1))(message));
              this.info(chalk.green(last(messages)));
            }
          },
          ctx.arduinoCli,
          payloadWithUpdatedFqbn
        );

        await fs.copy(path.resolve(ctx.sketchDir, sketchName), output, {
          overwrite: true,
        });
        await fs.remove(ctx.sketchDir);
        this.info(
          `The sketch and compiled firmware are saved to ${chalk.underline(
            output
          )}`
        );
      })
      .then(() => exit(0))
      .catch(err => {
        if (messages) this.info(messages.join('\n'));
        this.printError(this.patchArduinoCliError(err));
        return exit((err.payload || err).code || 100);
      });
  }
}

CompileCommand.description = 'compiles (verifies) a XOD program';

CompileCommand.usage = 'compile [options] [entrypoint]';

CompileCommand.flags = {
  ...BaseCommand.flags,
  ...pick(['board', 'debug', 'workspace'], myFlags),
  output: flags.string({
    char: 'o',
    description:
      'save the result binary to the directory; the same directory is used for intermediate build artifacts; defaults to `cwd`',
    env: 'XOD_OUTPUT',
    helpValue: 'path',
  }),
};

CompileCommand.args = [commonArgs.entrypoint];

CompileCommand.examples = [
  'Compile a program using the current patch as entry point\n' +
    '$ xodc compile -b arduino:avr:uno\n',
  // 'Compile the current project with `main` patch as entry point, use cloud compilation\n' +
  //   '$ xodc compile -b arduino:avr:uno --cloud main\n',
  'Compile the patch `main` from the xodball project and save binaries in `bin/uno.hex`\n' +
    '$ xodc compile -b arduino:arv:uno foo.xodball main -o bin/uno.hex',
];

CompileCommand.strict = false;

export default CompileCommand;
