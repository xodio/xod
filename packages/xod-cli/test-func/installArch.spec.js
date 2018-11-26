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

const its = wd => {
  const myWSPath = path.resolve(wd, 'workspace');

  const stdMock = test.stdout().stderr();

  stdMock
    .command(['install:arch', `--workspace=${myWSPath}`, 'adfkjasdfkjasdf'])
    .it(
      `print error on nonexistent board, creates workspace, stdout is empty, stderr with error, non-zero exit code`,
      async ctx => {
        assert.isOk(
          await fs.pathExists(path.resolve(myWSPath, '.xodworkspace')),
          'workspace should be created'
        );
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.include(
          ctx.stderr,
          'Error: invalid item',
          'stderr must contain error'
        );
        assert.notEqual(process.exitCode, 0, 'exit code must be non-zero');
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .command(['install:arch', '--quiet', 'adfkjasdfkjasdf'])
    .it(
      `quiet fails on nonexistent board, creates workspace, stdout is empty, stderr with error, non-zero exit code`,
      async ctx => {
        assert.isOk(
          await fs.pathExists(path.resolve(myWSPath, '.xodworkspace')),
          'workspace should be created'
        );
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.equal(ctx.stderr, '', 'stderr must be empty');
        assert.notEqual(process.exitCode, 0, 'exit code must be non-zero');
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .command(['install:arch', 'emoro:avr'])
    .it(
      `installs board, creates workspace, stdout is empty, stderr with messages, zero exit code`,
      async ctx => {
        assert.isOk(
          await fs.pathExists(path.resolve(myWSPath, '.xodworkspace')),
          'workspace should be created'
        );
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.include(
          ctx.stderr,
          'Installing',
          'stderr with install messages'
        );
        assert.equal(process.exitCode, 0, 'exit code must be zero');
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .command(['install:arch', '--quiet', 'emoro:avr'])
    .it(
      `silently installs board, creates workspace, stdout is empty, stderr is empty, zero exit code`,
      async ctx => {
        assert.isOk(
          await fs.pathExists(path.resolve(myWSPath, '.xodworkspace')),
          'workspace should be created'
        );
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.equal(ctx.stderr, '', 'stderr must be empty');
        assert.equal(process.exitCode, 0, 'exit code must be zero');
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .env({ XOD_ARDUINO_CLI: '/nonexistent' })
    .command(['install:arch', 'emoro:avr'])
    .it(
      `arduino-cli not found, stdout is empty, stderr with error, non-zero exit code`,
      async ctx => {
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.include(
          ctx.stderr,
          'arduino-cli not found',
          'stderr with error'
        );
        assert.notEqual(process.exitCode, 0, 'exit code must be non-zero');
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .env({ XOD_ARDUINO_CLI: '/nonexistent' })
    .command(['install:arch', '-q', 'emoro:avr'])
    .it(
      `arduino-cli not found, quiet flag, stdout is empty, stderr is empty, non-zero exit code`,
      async ctx => {
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.equal(ctx.stderr, '', 'stderr must be empty');
        assert.notEqual(process.exitCode, 0, 'exit code must be non-zero');
      }
    );
};

describe('xodc install:arch', () => {
  // working directory, workspace, src project path
  const wd = createWorkingDirectory('installArch');

  // create working directory
  before(() => fs.ensureDir(wd));

  // remove working directory
  // unmock TTY status
  after(() => {
    process.stdout.isTTY = isTTY;
    process.stderr.isTTY = isTTY;
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
      .command(['install:arch', '--help'])
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
      .command(['install:arch', '--version'])
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

    after(() => {
      fs.removeSync(wd);
    });

    its(wd);
  });

  describe('no TTY', () => {
    before(() => {
      process.stdout.isTTY = false;
      process.stderr.isTTY = false;
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

    after(() => {
      fs.removeSync(wd);
    });

    its(wd);
  });
});
