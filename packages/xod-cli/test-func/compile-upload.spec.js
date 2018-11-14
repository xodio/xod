import { test } from '@oclif/test';
import { assert } from 'chai';
import path from 'path';
import process from 'process';
import fs from 'fs-extra';
import { createWorkingDirectory, getFilesFromPath } from './helpers';

// save process.exit for unmocking
const exit = process.exit;

// save tty status
const isTTY = process.stdout.isTTY;

const compile = (wd, myWSPath, outputPath) => {
  const stdMock = test.stdout().stderr();

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .command([
      'compile',
      '--board',
      'arduino:avr:due',
      'bundle/workspace/blink',
      '@/main',
    ])
    .it(
      `fails with nonexistent board, stdout is empty, stderr with error, non-zero exit code`,
      async ctx => {
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.include(
          ctx.stderr,
          'Arduino dependencies missing',
          'stderr must be with error'
        );
        assert.notEqual(process.exitCode, 0, 'exit code must be non-zero');
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .command([
      'compile',
      '--quiet',
      '--board',
      'fqbn:aslkdjflaskjdflkasaf',
      'bundle/workspace/blink',
      '@/main',
    ])
    .it(
      `fails with nonexistent board, stdout is empty, stderr is empty (quiet), non-zero exit code`,
      async ctx => {
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.equal(ctx.stderr, '', 'stderr must be empty');
        assert.notEqual(process.exitCode, 0, 'exit code must be non-zero');
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .env({ XOD_BOARD: 'esp8266:esp8266:wifi_slot' })
    .command([
      'compile',
      'bundle/workspace/blinkaslkajdfhlaskdjfhlkasjdf',
      '@/mainsdf',
    ])
    .it(
      `fails with nonexistent project/patch, stdout is empty, stderr with error, non-zero exit code`,
      async ctx => {
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.include(
          ctx.stderr,
          'Invalid file path',
          'stderr must be with error'
        );
        assert.notEqual(process.exitCode, 0, 'exit code must be non-zero');
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .env({ XOD_BOARD: 'esp8266:esp8266:wifi_slot' })
    .command([
      'compile',
      '--quiet',
      'bundle/workspace/blinkaslkajdfhlaskdjfhlkasjdf',
      '@/mainsdf',
    ])
    .it(
      `fails with nonexistent project/patch, stdout is empty, stderr is empty (quiet), non-zero exit code`,
      async ctx => {
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.equal(ctx.stderr, '', 'stderr must be empty');
        assert.notEqual(process.exitCode, 0, 'exit code must be non-zero');
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .env({ XOD_BOARD: 'esp8266:esp8266:wifi_slot' })
    .command([
      'compile',
      '--output',
      outputPath,
      'bundle/workspace/blink',
      '@/main',
    ])
    .it(
      `compile patch, stdout is empty, stderr with messages, zero exit code`,
      async ctx => {
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.include(
          ctx.stderr,
          'The sketch and compiled firmware',
          'stderr with messages'
        );
        assert.equal(process.exitCode, 0, 'exit code must be zero');
        assert.isNotEmpty(
          await getFilesFromPath(outputPath, 'ino'),
          'source file is must'
        );
        assert.isNotEmpty(
          await getFilesFromPath(outputPath, 'hex|bin|elf'),
          'firmware file is must'
        );
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .env({ XOD_BOARD: 'esp8266:esp8266:wifi_slot' })
    .env({ XOD_OUTPUT: outputPath })
    .command(['compile', '--debug', 'bundle/workspace/blink', '@/main'])
    .it(
      `compile patch, stdout is empty, stderr is empty (quiet), zero exit code`,
      async ctx => {
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.include(
          ctx.stderr,
          'The sketch and compiled firmware',
          'stderr with messages'
        );
        assert.equal(process.exitCode, 0, 'exit code must be zero');
        assert.isNotEmpty(
          await getFilesFromPath(outputPath, 'ino'),
          'source file is must'
        );
        assert.isNotEmpty(
          await getFilesFromPath(outputPath, 'hex|bin|elf'),
          'firmware file is must'
        );
      }
    );
};

const upload = (wd, myWSPath) => {
  const stdMock = test.stdout().stderr();

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .command([
      'upload',
      '--board',
      'arduino:avr:due',
      '--port',
      '/dev/null',
      'bundle/workspace/blink',
      '@/main',
    ])
    .it(
      `fails with nonexistent board, stdout is empty, stderr with error, non-zero exit code`,
      async ctx => {
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.include(
          ctx.stderr,
          'Arduino dependencies missing',
          'stderr must be with error'
        );
        assert.notEqual(process.exitCode, 0, 'exit code must be non-zero');
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .env({ XOD_PORT: '/dev/null' })
    .command([
      'upload',
      '--quiet',
      '--board',
      'fqbn:aslkdjflaskjdflkasaf',
      'bundle/workspace/blink',
      '@/main',
    ])
    .it(
      `fails with nonexistent board, stdout is empty, stderr is empty (quiet), non-zero exit code`,
      async ctx => {
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.equal(ctx.stderr, '', 'stderr must be empty');
        assert.notEqual(process.exitCode, 0, 'exit code must be non-zero');
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .env({ XOD_BOARD: 'esp8266:esp8266:wifi_slot' })
    .env({ XOD_PORT: '/dev/null' })
    .command([
      'upload',
      'bundle/workspace/blinkaslkajdfhlaskdjfhlkasjdf',
      '@/mainsdf',
    ])
    .it(
      `fails with nonexistent project/patch, stdout is empty, stderr with error, non-zero exit code`,
      async ctx => {
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.include(
          ctx.stderr,
          'Invalid file path',
          'stderr must be with error'
        );
        assert.notEqual(process.exitCode, 0, 'exit code must be non-zero');
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .env({ XOD_BOARD: 'esp8266:esp8266:wifi_slot' })
    .env({ XOD_PORT: '/dev/null' })
    .command([
      'upload',
      '--quiet',
      'bundle/workspace/blinkaslkajdfhlaskdjfhlkasjdf',
      '@/mainsdf',
    ])
    .it(
      `fails with nonexistent project/patch, stdout is empty, stderr is empty (quiet), non-zero exit code`,
      async ctx => {
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.equal(ctx.stderr, '', 'stderr must be empty');
        assert.notEqual(process.exitCode, 0, 'exit code must be non-zero');
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .env({ XOD_BOARD: 'esp8266:esp8266:wifi_slot' })
    .env({ XOD_PORT: '/dev/null' })
    .command(['upload', '--debug', 'bundle/workspace/blink', '@/main'])
    .it(
      `try to compile and upload patch, fail on nonexistent port, stdout is empty, stderr with messages, non-zero exit code`,
      async ctx => {
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.include(ctx.stderr, 'Upload failed', 'stderr with messages');
        assert.notEqual(process.exitCode, 0, 'exit code must be non-zero');
      }
    );

  stdMock
    .env({ XOD_WORKSPACE: myWSPath })
    .env({ XOD_BOARD: 'esp8266:esp8266:wifi_slot' })
    .env({ XOD_PORT: '/dev/null' })
    .command([
      'upload',
      '--debug',
      '--quiet',
      'bundle/workspace/blink',
      '@/main',
    ])
    .it(
      `try to compile and upload patch, fail on nonexistent port, stdout is empty, stderr is empty (quiet), non-zero exit code`,
      async ctx => {
        assert.equal(ctx.stdout, '', 'stdout must be empty');
        assert.equal(ctx.stderr, '', 'stderr must be empty');
        assert.notEqual(process.exitCode, 0, 'exit code must be non-zero');
      }
    );
};

describe('xodc', () => {
  const wd = createWorkingDirectory('compile');
  const myWSPath = path.resolve(wd, 'workspace');
  const outputPath = path.resolve(wd, 'out');

  // create working directory
  before(() => fs.ensureDirSync(wd));

  // remove working directory
  // unmock TTY status
  after(() => {
    process.stdout.isTTY = isTTY;
    process.stderr.isTTY = isTTY;
    fs.removeSync(wd);
  });

  describe('install dependencies', () => {
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
      .env({ XOD_WORKSPACE: myWSPath })
      .command(['install:arch', '-q', 'esp8266:esp8266'])
      .it(`install toolchain for tests`, async () => {
        assert.equal(process.exitCode, 0, 'exit code must be zero');
        assert.isOk(
          await fs.pathExists(
            path.resolve(myWSPath, '__packages__', 'packages', 'esp8266')
          ),
          'toolchain must be installed'
        );
      });
  });

  describe('compile', () => {
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
        .command(['compile', '--help'])
        .catch(/EEXIT: 0/)
        .it(
          `shows help in stdout, doesn't print to stderr, exits with 0`,
          ctx => {
            assert.include(ctx.stdout, '--version', '--version flag not found');
            assert.include(ctx.stdout, '--help', '--help flag not found');
            assert.include(ctx.stdout, '--quiet', '--quiet flag not found');
            assert.include(ctx.stdout, '--output', '--output flag not found');
            assert.include(ctx.stdout, '--debug', '--debug flag not found');
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
        .command(['compile', '--version'])
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

      // unmock process.exit and remove tmp dir
      afterEach(() => {
        process.exit = exit;
        fs.removeSync(outputPath);
      });

      compile(wd, myWSPath, outputPath);
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

      // unmock process.exit and remove tmp dir
      afterEach(() => {
        process.exit = exit;
        fs.removeSync(outputPath);
      });

      compile(wd, myWSPath, outputPath);
    });
  });

  describe('upload', () => {
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
        .command(['upload', '--help'])
        .catch(/EEXIT: 0/)
        .it(
          `shows help in stdout, doesn't print to stderr, exits with 0`,
          ctx => {
            assert.include(ctx.stdout, '--version', '--version flag not found');
            assert.include(ctx.stdout, '--help', '--help flag not found');
            assert.include(ctx.stdout, '--quiet', '--quiet flag not found');
            assert.include(ctx.stdout, '--port', '--port flag not found');
            assert.include(ctx.stdout, '--debug', '--debug flag not found');
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
        .command(['upload', '--version'])
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
        fs.removeSync(outputPath);
      });

      upload(wd, myWSPath);
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
        fs.removeSync(outputPath);
      });

      upload(wd, myWSPath);
    });
  });
});
