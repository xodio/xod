/* eslint-disable no-param-reassign */
import path from 'path';
import { stdout, exit } from 'process';
import { pick } from 'ramda';
import { flags } from '@oclif/command';
import {
  loadProject,
  resolvePath,
  saveProjectAsXodball,
  saveProjectEntirely,
} from 'xod-fs';
import { toXodball } from 'xod-project';
import BaseCommand from '../baseCommand';
import * as commonArgs from '../args';
import * as myFlags from '../flags';
import { resolveBundledWorkspacePath } from '../paths';
import { getListr } from '../listr';

class ResaveCommand extends BaseCommand {
  async run() {
    this.parseArgv(ResaveCommand);
    await this.ensureWorkspace();
    await this.parseEntrypoint();
    const { output, workspace, quiet } = this.flags;
    const { projectPath } = this.args;

    const loadProjectTask = {
      title: 'Project loading',
      task: ctx =>
        loadProject(
          [workspace, resolveBundledWorkspacePath()],
          projectPath
        ).then(project => {
          ctx.project = project;
        }),
    };

    const saveToFileTask = {
      title: 'Saving...',
      skip: ctx => !(ctx.project && output),
      task: ctx =>
        (path.extname(output) === '.xodball'
          ? saveProjectAsXodball(output, ctx.project)
          : saveProjectEntirely(output, ctx.project)
        ).then(() => {
          ctx.status = `Saved to ${output}`;
        }),
    };

    await getListr(!quiet, [loadProjectTask, saveToFileTask], {
      collapse: false,
    })
      .run()
      .then(async ctx => {
        if (output && ctx.status) {
          this.info(ctx.status);
        }

        if (!output) {
          stdout.write(toXodball(ctx.project));
        }
      })
      .then(() => exit(0))
      .catch(err => {
        this.printError(err);
        return exit(100);
      });
  }
}

ResaveCommand.description =
  'opens a project and saves it in another location or format';

ResaveCommand.usage = 'resave [options] [project]';

ResaveCommand.flags = {
  ...BaseCommand.flags,
  ...pick(['workspace'], myFlags),
  output: flags.string({
    char: 'o',
    description:
      'xodball or multifile directory output path, defaults to stdout',
    env: 'XOD_OUTPUT',
    helpValue: 'path',
    parse: p => resolvePath(p),
  }),
};

ResaveCommand.args = [commonArgs.project];

ResaveCommand.examples = [
  `Exports the current multifile project to a xodball\n` +
    `$ xodc resave . -o ~/foo.xodball\n`,
  `Outputs the current multifile project as a xodball to stdout\n` +
    `$ xodc resave\n`,
  `Resaves one xodball into another (useful for applying migrations)\n` +
    `$ xodc resave foo.xodball -o bar.xodball\n`,
  `Converts a xodball to a multifile project\n` +
    `$ xodc resave foo.xodball -o /some/new/dir`,
];

ResaveCommand.strict = false;

export default ResaveCommand;
