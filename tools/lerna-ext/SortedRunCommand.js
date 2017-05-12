const async = require('async');
const RunCommand = require('lerna/lib/commands/RunCommand').default;
const topologicallyBatchPackages = require('./batch');
const withDependencies = require('./dependencies');

/*
 * SortedRunCommand is an upgrade to the straightforward `lerna run`.
 *
 * It uses topological sort to order inter-dependent packages properly.
 * And it allows `withDeps` flag that cause the command to be executed
 * on all dependencies (recursively) of the scope provided.
 */
class SortedRunCommand extends RunCommand {
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
    const batches = topologicallyBatchPackages(this.packagesWithScript);

    const runBatch = () => {
      const batch = batches.shift();

      async.parallelLimit(batch.map((pkg) => (cb) => {
        this.runScriptInPackage(pkg, cb);
      }), this.concurrency, (err) => {
        if (batches.length && !err) {
          runBatch();
        } else {
          callback(err);
        }
      });
    };

    runBatch();
  }
}

module.exports = SortedRunCommand;
