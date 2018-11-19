/* eslint-disable no-param-reassign */
import { exit, stdout } from 'process';
import { pick } from 'ramda';
import { flags } from '@oclif/command';
import { writeFile, resolvePath } from 'xod-fs';

import BaseCommand from '../baseCommand';
import * as commonArgs from '../args';
import * as myFlags from '../flags';
import { getListr } from '../listr';
import { loadProjectTask, transformTask, transpileTask } from '../listrTasks';
import { resolveBundledWorkspacePath } from '../paths';

class TranspileCommand extends BaseCommand {
  async run() {
    this.parseArgv(TranspileCommand);
    await this.ensureWorkspace();
    await this.parseEntrypoint();
    const { debug, output, quiet } = this.flags;
    const { projectPath } = this.args;
    const workspaces = [this.flags.workspace, resolveBundledWorkspacePath()];
    const patchName = this.args.patchName || '@/main';

    const saveToFileTask = out => ({
      title: 'Saving',
      skip: ctx => !(ctx.transpile && out),
      task: ctx =>
        writeFile(out, ctx.transpile, 'utf-8').then(r => {
          ctx.status = `Saved to ${r.path}`;
        }),
    });

    await getListr(
      !quiet,
      [
        loadProjectTask(workspaces, projectPath),
        transformTask(patchName, debug),
        transpileTask(),
        saveToFileTask(output),
      ],
      { collapse: false }
    )
      .run()
      .then(async ctx => {
        if (output && ctx.status) {
          this.info(ctx.status);
        }

        if (!output) {
          stdout.write(ctx.transpile);
        }
      })
      .then(() => exit(0))
      .catch(err => {
        this.printError(err);
        return exit(100);
      });
  }
}

TranspileCommand.description = 'transpiles (generates C++) a XOD program';

TranspileCommand.usage = 'transpile [options] [entrypoint]';

TranspileCommand.flags = {
  ...BaseCommand.flags,
  ...pick(['debug', 'workspace'], myFlags),
  output: flags.string({
    char: 'o',
    description: 'C++ output file path, default to stdout',
    env: 'XOD_OUTPUT',
    helpValue: 'path',
    parse: p => resolvePath(p),
  }),
};

TranspileCommand.args = [commonArgs.entrypoint];

TranspileCommand.examples = [
  'Transpile a program using the cwd patch as entry point, print to stdout\n' +
    '$ xodc transpile\n',
  'Transpile the current project with `main` patch as entry point, save the output in `x.cpp`\n' +
    '$ xodc transpile main -o x.cpp\n',
  'Transpile a project in the xodball with `main` patch as entry point\n' +
    '$ xodc transpile foo.xodball main',
];

TranspileCommand.strict = false;

export default TranspileCommand;
