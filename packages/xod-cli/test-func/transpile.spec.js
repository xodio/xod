import { test } from '@oclif/test';
import { assert } from 'chai';
import path from 'path';
import process from 'process';
import fs from 'fs-extra';
import { bundledWorkspacePath, createWorkingDirectory } from './helpers';

// save process.exit for unmocking
const exit = process.exit;

// save tty status
const isTTY = process.stdout.isTTY;

const its = (wd, outCppPath) => {
  const myWSPath = path.resolve(wd, 'workspace');
  const projectSrcPath = path.resolve(bundledWorkspacePath, 'blink');

  const stdMock = test.stdout().stderr();

  stdMock
    .command(['transpile', `--workspace=${myWSPath}`])
    .it(
      `cannot find project without argument, but creates workspace, stderr , non-zero exit code`,
      async ctx => {
        assert.isOk(
          await fs.pathExists(path.resolve(myWSPath, '.xodworkspace')),
          'workspace should be created'
        );
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.match(
          ctx.stderr,
          /could not find project directory around/,
          'stderr must be with error'
        );
        assert.notEqual(process.exitCode, 0, 'exit code must be non-zero');
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .command([
      'transpile',
      path.resolve(myWSPath, 'kajsdhflkjsdhflkjashldkfjlkjasdfkjl'),
    ])
    .it(
      'fails when wrong path to project, workspace from ENV, exits with non-zero code',
      ctx => {
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.match(
          ctx.stderr,
          /Invalid file path/,
          'stderr must be with error'
        );
        assert.notEqual(process.exitCode, 0, 'exit code must be non-zero');
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .command(['transpile', projectSrcPath, 'asdfasdfasdfasdfasdfasdfasdf'])
    .it('fails when wrong patch name, exits with non-zero code', ctx => {
      assert.equal(ctx.stdout, '', 'stdout must be empty');
      assert.match(
        ctx.stderr,
        /ENTRY_POINT_PATCH_NOT_FOUND_BY_PATH/,
        'stderr must be with error'
      );
      assert.notEqual(process.exitCode, 0, 'exit code must be non-zero');
    });

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .command(['transpile', `--output=${outCppPath}`, projectSrcPath])
    .it(
      'transpiles project (default patchname - main) to output path, stderr with messages, stdout is empty, exit with zero code',
      async ctx => {
        assert.isOk(
          await fs.pathExists(outCppPath),
          'output file should be created'
        );
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.notEqual(ctx.stderr, '', 'stderr must be full of messages');
        assert.equal(process.exitCode, 0, 'exit code must be zero');
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .env({ XOD_OUTPUT: outCppPath })
    .command(['transpile', '--quiet', projectSrcPath, '@/main'])
    .it(
      'transpiles project to output path (from ENV), stderr is empty, stdout is empty, exit with zero code',
      async ctx => {
        assert.isOk(
          await fs.pathExists(outCppPath),
          'output file should be created'
        );
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.equal(ctx.stderr, '', 'stderr must be empty');
        assert.equal(process.exitCode, 0, 'exit code must be zero');
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .command(['transpile', projectSrcPath])
    .it(
      'transpiles project (default patchname - main) to stdout, stderr with messages, exit with zero code',
      ctx => {
        assert.include(
          ctx.stdout,
          'namespace xod {',
          'stdout must containt C++ source'
        );
        assert.match(
          ctx.stdout,
          /^\/\/#define XOD_DEBUG$/gm,
          'debug must be disabled'
        );
        assert.notEqual(ctx.stderr, '', 'stderr must be with messages');
        assert.equal(process.exitCode, 0, 'exit code must be zero');
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .command(['transpile', '--debug', projectSrcPath])
    .it(
      'transpile project (default patchname - main) to stdout with debug on, stderr with messages, exit with zero code',
      ctx => {
        assert.include(
          ctx.stdout,
          'namespace xod {',
          'stdout must containt C++ source'
        );
        assert.match(
          ctx.stdout,
          /^#define XOD_DEBUG$/gm,
          'debug must be enabled'
        );
        assert.notEqual(ctx.stderr, '', 'stderr must be with messages');
        assert.equal(process.exitCode, 0, 'exit code must be zero');
      }
    );
};

describe('xodc transpile', () => {
  // working directory and output file
  const wd = createWorkingDirectory('transpile');
  const outCppPath = path.resolve(wd, 'out.cpp');

  // create working directory
  before(() => fs.ensureDirSync(wd));

  // remove working directory
  after(() => fs.removeSync(wd));

  // remove working directory
  // unmock TTY status
  after(() => {
    process.stdout.isTTY = isTTY;
    process.stderr.isTTY = isTTY;
    return fs.remove(wd);
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
      .command(['transpile', '--help'])
      .catch(/EEXIT: 0/)
      .it(
        `shows help in stdout, doesn't print to stderr, exits with 0`,
        ctx => {
          assert.include(
            ctx.stdout,
            'ENTRYPOINT',
            'ENTRYPOINT argument not found'
          );
          assert.include(ctx.stdout, '--help', '--help flag not found');
          assert.include(ctx.stdout, '--output', '--output flag not found');
          assert.include(ctx.stdout, '--quiet', '--quiet flag not found');
          assert.include(ctx.stdout, '--version', '--version flag not found');
          assert.include(
            ctx.stdout,
            '--workspace',
            '--workspace flag not found'
          );
          assert.include(ctx.stdout, '--debug', '--debug flag not found');
          assert.equal(ctx.stderr, '', 'stderr should be emply');
        }
      );

    test
      .stdout()
      .stderr()
      .command(['transpile', '--version'])
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
      // remove output file
      fs.removeSync(outCppPath);
    });

    its(wd, outCppPath);
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
      // remove output file
      fs.removeSync(outCppPath);
    });

    its(wd, outCppPath);
  });
});
