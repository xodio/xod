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

const its = (wd, tabtestOutDir) => {
  const myWSPath = path.resolve(wd, 'workspace');

  const stdMock = test.stdout().stderr();

  stdMock
    .command(['tabtest', `--workspace=${myWSPath}`])
    .it(
      `cannot find project without argument, but creates workspace, prints error to stderr, non-zero exit code`,
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
      'tabtest',
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
    .command([
      'tabtest',
      path.resolve(bundledWorkspacePath, '__lib__', 'xod', 'bits'),
      'asdfasdfasdfasdfasdfasdfasdf',
    ])
    .it('fails when wrong patch name, exits with non-zero code', ctx => {
      assert.equal(ctx.stdout, '', 'stdout must be empty');
      assert.match(
        ctx.stderr,
        /does not exist in the project/,
        'stderr must be with error'
      );
      assert.notEqual(process.exitCode, 0, 'exit code must be non-zero');
    });

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .command([
      'tabtest',
      `--output-dir=${tabtestOutDir}`,
      '--no-build',
      path.resolve(bundledWorkspacePath, '__lib__', 'xod', 'bits'),
    ])
    .it(
      'create output dir, run tests for whole project, but do not build (--no-build), stderr with messages, stdout is empty, exit with zero code',
      async ctx => {
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.notEqual(ctx.stderr, '', 'stderr must be with messages');
        assert.equal(process.exitCode, 0, 'exit code must be zero');
        assert.isOk(
          await fs.pathExists(tabtestOutDir),
          'output dir should be created'
        );
        assert.isOk(
          await fs.pathExists(
            path.resolve(tabtestOutDir, 'bcd-to-dec.sketch.cpp')
          ),
          'tabtest sketch must be copied'
        );
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .env({ XOD_OUTPUT: tabtestOutDir })
    .command([
      'tabtest',
      '--no-build',
      '--quiet',
      path.resolve(
        bundledWorkspacePath,
        '__lib__',
        'xod',
        'bits',
        'bcd-to-dec',
        'patch.xodp'
      ),
    ])
    .it(
      'create output dir, run tests for patch by full path, but do not build (--no-build), stderr with messages, stdout is empty, exit with zero code',
      async ctx => {
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.equal(ctx.stderr, '', 'stderr must be empty');
        assert.equal(process.exitCode, 0, 'exit code must be zero');
        assert.isOk(
          await fs.pathExists(tabtestOutDir),
          'output dir should be created'
        );
        assert.isOk(
          await fs.pathExists(
            path.resolve(tabtestOutDir, 'bcd-to-dec.sketch.cpp')
          ),
          'tabtest sketch must be copied'
        );
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .env({ XOD_OUTPUT: tabtestOutDir })
    .command([
      'tabtest',
      '--no-build',
      '--quiet',
      path.resolve(bundledWorkspacePath, '__lib__', 'xod', 'bits'),
      'bcd-to-dec',
    ])
    .it(
      'create output dir, run tests for patch by project path + short patch name, but do not build (--no-build), stderr with messages, stdout is empty, exit with zero code',
      async ctx => {
        assert.isOk(
          await fs.pathExists(tabtestOutDir),
          'output dir should be created'
        );
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.equal(ctx.stderr, '', 'stderr must be empty');
        assert.equal(process.exitCode, 0, 'exit code must be zero');
        assert.isOk(
          await fs.pathExists(
            path.resolve(tabtestOutDir, 'bcd-to-dec.sketch.cpp')
          ),
          'tabtest sketch must be copied'
        );
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .env({ XOD_OUTPUT: tabtestOutDir })
    .command([
      'tabtest',
      '--quiet',
      path.resolve(bundledWorkspacePath, '__lib__', 'xod', 'bits'),
      '@/bcd-to-dec',
    ])
    .it(
      'create output dir, run tests for patch by project path + long patch name, build, stderr with messages, stdout is empty, exit with zero code',
      async ctx => {
        assert.isOk(
          await fs.pathExists(tabtestOutDir),
          'output dir should be created'
        );
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.equal(ctx.stderr, '', 'stderr must be empty');
        assert.equal(process.exitCode, 0, 'exit code must be zero');
        assert.isOk(
          await fs.pathExists(path.resolve(tabtestOutDir, 'bcd-to-dec.run')),
          'tabtest must be compiled'
        );
      }
    );
};

describe('xodc tabtest', () => {
  // working directory
  const wd = createWorkingDirectory('tabtest');
  const tabtestOutDir = path.resolve(wd, 'tabtests');

  // create working directory
  before(() => fs.ensureDirSync(wd));

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
      .command(['tabtest', '--help'])
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
          assert.include(ctx.stdout, '--no-build', '--no-build flag not found');
          assert.include(
            ctx.stdout,
            '--output-dir',
            '--output-dir flag not found'
          );
          assert.include(ctx.stdout, '--quiet', '--quiet flag not found');
          assert.include(ctx.stdout, '--version', '--version flag not found');
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
      .command(['tabtest', '--version'])
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
      // clean out tabtest working directory
      fs.removeSync(tabtestOutDir);
    });

    its(wd, tabtestOutDir);
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
      // clean out tabtest working directory
      fs.removeSync(tabtestOutDir);
    });

    its(wd, tabtestOutDir);
  });
});
