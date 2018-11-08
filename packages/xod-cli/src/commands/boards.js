/* eslint-disable no-param-reassign */
import { exit } from 'process';
import {
  compose,
  concat,
  filter,
  map,
  none,
  pluck,
  prop,
  sortBy,
  startsWith,
} from 'ramda';
import asTable from 'as-table';
import * as xdb from 'xod-deploy-bin';
import BaseCommand from '../baseCommand';
import { resolveBundledWorkspacePath } from '../paths';

const mergeAvailableInstalled = (available, installed) => {
  const fqbns = pluck('fqbn', installed);
  return concat(
    installed,
    compose(filter(el => none(startsWith(el.package))(fqbns)))(available)
  );
};

class BoardsCommand extends BaseCommand {
  async run() {
    this.parseArgv(BoardsCommand);
    await this.ensureWorkspace();
    const { workspace, quiet } = this.flags;

    try {
      const sketchDir = await xdb.prepareSketchDir();
      const aCli = await xdb.createCli(
        resolveBundledWorkspacePath(),
        workspace,
        sketchDir
      );

      const boards = compose(
        map(el => ({
          'Board Name': el.name,
          FQBN: el.fqbn || `${el.package} [not installed]`,
        })),
        sortBy(prop('name')),
        b => mergeAvailableInstalled(b.available, b.installed)
      )(await xdb.listBoards(workspace, aCli));

      const rows = quiet ? map(b => [b['Board Name'], b.FQBN])(boards) : boards;

      const table = process.stdout.columns
        ? asTable.configure({ maxTotalWidth: process.stdout.columns })(rows)
        : asTable(rows);
      process.stdout.write(`${table}\n`);
      return exit(0);
    } catch (err) {
      this.printError(this.patchArduinoCliError(err));
      return exit((err.payload || err).code || 100);
    }
  }
}

BoardsCommand.description = 'show available boards';

BoardsCommand.usage = 'boards [options]';

BoardsCommand.flags = BaseCommand.flags;

BoardsCommand.args = [];

BoardsCommand.strict = false;

export default BoardsCommand;
