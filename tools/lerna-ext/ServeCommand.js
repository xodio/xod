
const chalk = require('chalk');
const async = require('async');
const escapeArgs = require('command-join');
const ChildProcessUtilities = require('lerna/lib/ChildProcessUtilities');
const RunCommand = require('lerna/lib/commands/RunCommand');
const withDependencies = require('./dependencies');

const exceptLast = func => (value, idx, self) => 
  ((idx === self.length - 1) ? value : func(value));

function pipeOutput(source, target, label) {
  const prefix = chalk.magenta(`[${label}] `);

  let lineBuffer = [];

  source.on('data', data =>
    data
      .split('\n')
      .map(exceptLast(l => l + '\n'))
      .forEach(pipe)
  );

  function pipe(data) {
    lineBuffer.push(data);
    if (data.endsWith('\n')) {
      target.write(prefix);
      target.write(lineBuffer.join(''));
      lineBuffer = [];
    }
  }
}

/*
 * ServeCommand is an upgrade for `lerna run` for NPM-commands that
 * keep running forever by design, e.g. watch, start, etc.
 *
 * It correctly handles real-time output streams of the processes
 * that otherwise is available only when a process terminates.
 */
class ServeCommand extends RunCommand {
  initialize(callback) {
    super.initialize((err, result) => {
      if (err) {
        callback(err);
        return;
      }
    });

    if (this.flags.withDeps) {
      this.logger.info('Including package dependencies');
      this.packagesWithScript = withDependencies(
        this.packagesWithScript,
        this.packages,
        this.script
      );
    }

    callback(null, true);
  }

  runScriptInPackages(callback) {
    async.parallelLimit(this.packagesWithScript.map((pkg) => (cb) => {
      this.runScriptInPackage(pkg, cb);
    }), 100, callback);
  }

  runScriptInPackage(pkg, callback) {
    const opts = {
      cwd: pkg.location,
      env: process.env
    };

    const command = `npm run ${this.script} ${escapeArgs(this.args)}`;
    const proc = ChildProcessUtilities.exec(command, opts, callback);

    pipeOutput(proc.stdout, process.stdout, pkg.name);
    pipeOutput(proc.stderr, process.stderr, pkg.name);
  }
}

module.exports = ServeCommand;
