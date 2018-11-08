import { test } from '@oclif/test';
import { assert } from 'chai';
import path from 'path';
import process from 'process';
import fs from 'fs-extra';
import { createWorkingDirectory } from './helpers';

// save process.exit for unmocking
const exit = process.exit;

// save tty status
const isTTY = process.stdout.isTTY;
const stdoutWidth = process.stdout.columns;
const stderrWidth = process.stderr.columns;

const its = wd => {
  const myWSPath = path.resolve(wd, 'workspace');

  const stdMock = test.stdout().stderr();

  stdMock
    .command(['boards', `--workspace=${myWSPath}`])
    .it(
      `list boards, creates workspace, stderr is empty, zero exit code`,
      async ctx => {
        assert.isOk(
          await fs.pathExists(path.resolve(myWSPath, '.xodworkspace')),
          'workspace should be created'
        );
        assert.include(ctx.stdout, 'Board Name', 'stdout must contain table');
        if (!process.stdout.columns) {
          assert.include(
            ctx.stdout,
            'not installed',
            'table with [not installed] flag'
          );
        }
        assert.equal(ctx.stderr, '', 'stderr must be empty');
        assert.equal(process.exitCode, 0, 'exit code must be zero');
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .command(['boards', `-q`])
    .it(
      `list boards (without header), creates workspace, stderr is empty, zero exit code`,
      async ctx => {
        assert.isOk(
          await fs.pathExists(path.resolve(myWSPath, '.xodworkspace')),
          'workspace should be created'
        );
        assert.notInclude(
          ctx.stdout,
          'Board Name',
          'stdout should not contain header'
        );
        if (!process.stdout.columns) {
          assert.include(
            ctx.stdout,
            'not installed',
            'table with [not installed] flag'
          );
        }
        assert.equal(ctx.stderr, '', 'stderr must be empty');
        assert.equal(process.exitCode, 0, 'exit code must be zero');
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .env({ XOD_ARDUINO_CLI: '/nonexistent' })
    .command(['boards'])
    .it(
      `arduino-cli not found, stdout is empty, stderr with error, non-zero exit code`,
      async ctx => {
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        if (!process.stdout.columns) {
          assert.include(
            ctx.stderr,
            'arduino-cli not found',
            'stderr with error'
          );
        }
        assert.notEqual(process.exitCode, 0, 'exit code must be non-zero');
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .env({ XOD_ARDUINO_CLI: '/nonexistent' })
    .command(['boards', '-q'])
    .it(
      `arduino-cli not found, quiet flag, stdout is empty, stderr is empty, non-zero exit code`,
      async ctx => {
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.equal(ctx.stderr, '', 'stderr must be empty');
        assert.notEqual(process.exitCode, 0, 'exit code must be non-zero');
      }
    );
};

describe('xodc boards', () => {
  // working directory, workspace, src project path
  const wd = createWorkingDirectory('boards');

  // create working directory
  before(() => fs.ensureDirSync(wd));

  // remove working directory
  // unmock TTY status
  after(() => {
    process.stdout.isTTY = isTTY;
    process.stderr.isTTY = isTTY;
    process.stdout.columns = stdoutWidth;
    process.stderr.columns = stderrWidth;
    fs.removeSync(wd);
  });

  describe('common', () => {
    // mock process.exit
    beforeEach(() => {
      process.exit = code => {
        process.exitCode = code;
      };
    });

    // unmock process.exit
    afterEach(() => {
      process.exit = exit;
    });

    test
      .stdout()
      .stderr()
      .command(['boards', '--help'])
      .catch(/EEXIT: 0/)
      .it(
        `shows help in stdout, doesn't print to stderr, exits with 0`,
        ctx => {
          assert.include(ctx.stdout, '--version', '--version flag not found');
          assert.include(ctx.stdout, '--help', '--help flag not found');
          assert.include(ctx.stdout, '--quiet', '--quiet flag not found');
          assert.include(
            ctx.stdout,
            '--workspace',
            '--workspace flag not found'
          );
          assert.equal(ctx.stderr, '', 'stderr should be emply');
        }
      );

    test
      .stdout()
      .stderr()
      .command(['boards', '--version'])
      .catch(/EEXIT: 0/)
      .it(
        `shows version in stdout, doesn't print to stderr and exits with 0`,
        ctx => {
          assert.include(ctx.stdout, 'xod-cli', 'version string not found');
          assert.equal(ctx.stderr, '', 'stderr should be emply');
        }
      );
  });

  describe('TTY', () => {
    before(() => {
      process.stdout.isTTY = true;
      process.stderr.isTTY = true;
      process.stdout.columns = 80;
      process.stderr.columns = 80;
    });

    // mock process.exit
    beforeEach(() => {
      process.exit = code => {
        process.exitCode = code;
      };
    });

    // unmock process.exit
    afterEach(() => {
      process.exit = exit;
    });

    its(wd);
  });

  describe('no TTY', () => {
    before(() => {
      process.stdout.isTTY = false;
      process.stderr.isTTY = false;
      process.stdout.columns = undefined;
      process.stderr.columns = undefined;
    });

    // mock process.exit
    beforeEach(() => {
      process.exit = code => {
        process.exitCode = code;
      };
    });

    // unmock process.exit
    afterEach(() => {
      process.exit = exit;
    });

    its(wd);
  });
});
