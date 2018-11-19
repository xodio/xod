/* eslint-disable no-param-reassign */
import { exit } from 'process';
import {
  compose,
  dropLast,
  last,
  lensProp,
  over,
  pick,
  replace,
  when,
} from 'ramda';
import fs from 'fs-extra';
import chalk from 'chalk';
import { flags } from '@oclif/command';
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

const stripMessage = compose(
  replace(/[^ -~\n]+/, ''),
  when(m => last(m) === '\n', dropLast(1))
);

class UploadCommand extends BaseCommand {
  async run() {
    this.parseArgv(UploadCommand);
    await this.ensureWorkspace();
    await this.parseEntrypoint();
    const { board, debug, port, workspace, quiet } = this.flags;
    const { projectPath } = this.args;
    const patchName = this.args.patchName || '@/main';

    // accumulate arduino-cli messages to this variable
    const messages = [];

    const initTask = {
      title: 'Initialize',
      task: async ctx => {
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
        { title: 'Uploading', task: () => Promise.resolve() },
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
            port: {
              comName: port,
            },
          }
        );
        await xdb.uploadThroughUSB(
          ({ message }) => {
            if (
              message !== '' &&
              message !== null &&
              message !== last(messages)
            ) {
              messages.push(stripMessage(message));
              this.info(chalk.green(last(messages)));
            }
          },
          ctx.arduinoCli,
          payloadWithUpdatedFqbn
        );
        await fs.remove(ctx.sketchDir);
        this.info('Done!');
      })
      .then(() => exit(0))
      .catch(err => {
        if (messages) this.info(messages.join('\n'));
        this.printError(this.patchArduinoCliError(err));
        return exit((err.payload || err).code || 100);
      });
  }
}

UploadCommand.description = 'uploads a XOD program to the board';

UploadCommand.usage = 'upload [options] [entrypoint]';

UploadCommand.flags = {
  ...BaseCommand.flags,
  ...pick(['board', 'debug', 'workspace'], myFlags),
  port: flags.string({
    char: 'p',
    description: 'port to use for upload',
    env: 'XOD_PORT',
    helpValue: 'port',
    required: true,
  }),
};

UploadCommand.args = [commonArgs.entrypoint];

UploadCommand.examples = [
  'Compile a program using the current patch as entry point, upload to ttyACM1\n' +
    '$ xodc upload -b arduino:avr:uno -p /dev/ttyACM1\n',
];

UploadCommand.strict = false;

export default UploadCommand;
