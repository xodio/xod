/* eslint-disable no-param-reassign */
import { exit } from 'process';
import fs from 'fs-extra';
import * as xdb from 'xod-deploy-bin';
import BaseCommand from '../../baseCommand';
import { resolveBundledWorkspacePath } from '../../paths';

class InstallArchCommand extends BaseCommand {
  async run() {
    this.parseArgv(InstallArchCommand);
    await this.ensureWorkspace();
    const { workspace } = this.flags;
    const { fqbn } = this.args;

    // accumulate arduino-cli messages to this variable
    const messages = [];

    try {
      const sketchDir = await xdb.prepareSketchDir();
      const aCli = await xdb.createCli(
        resolveBundledWorkspacePath(),
        workspace,
        sketchDir
      );
      await aCli.core.install(progress => {
        if (progress.message !== null) messages.push(progress.message);
        this.printArduinoCliProgress(progress);
      }, fqbn);
      await fs.remove(sketchDir);
      this.info('Done!');
      return exit(0);
    } catch (err) {
      if (messages) this.info(messages.join('\n'));
      this.printError(this.patchArduinoCliError(err));
      return exit((err.payload || err).code || 100);
    }
  }
}

InstallArchCommand.description = 'install toolchains';

InstallArchCommand.usage = 'install:arch [fqbn]';

InstallArchCommand.flags = BaseCommand.flags;

InstallArchCommand.args = [
  {
    name: 'fqbn',
    required: true,
    hidden: false,
    description:
      'Board FQBN. `arduino:sam` for example. See `xodc boards` list for the full list.',
  },
];

InstallArchCommand.strict = true;

export default InstallArchCommand;
