#!/usr/bin/env node
/*
 * make.js -- CLI tool to run NPM commands on packages taking their
 * dependency graph into account. Usage example:
 *
 * $ ./make.js --tree build xod-client-browser
 *
 * Run `./make.js --help` for details
 */
const path = require('path');
const async = require('async');
const program = require('commander');
const PackageUtilities = require('lerna/lib/PackageUtilities');
const RunCommand = require('lerna/lib/commands/RunCommand');

/*
 * Sorts Lerna packages in topological order and returns array
 * of batches which can be runned concurrently.
 *
 * The implementation is stolen from:
 * https://github.com/seansfkelley/lerna/commit/4e3e4789a4d627f90d8eb899dd9514818105aa7b
 *
 * It will be possibly merged with Lerna upstream. Watch for:
 * https://github.com/lerna/lerna/issues/342
 *
 */
function topologicallyBatchPackages(packagesToBatch) {
  // We're going to be chopping stuff out of this array, so copy it.
  const packages = packagesToBatch.slice();
  const packageGraph = PackageUtilities.getPackageGraph(packages);

  // This maps package names to the number of packages that depend on them.
  // As packages are completed their names will be removed from this object.
  const refCounts = {};
  packages.forEach((pkg) => packageGraph.get(pkg.name).dependencies.forEach((dep) => {
    if (!refCounts[dep]) refCounts[dep] = 0;
    refCounts[dep]++;
  }));

  const batches = [];
  while (packages.length) {
    // Get all packages that have no remaining dependencies within the repo
    // that haven't yet been picked.
    const batch = packages.filter((pkg) => {
      const node = packageGraph.get(pkg.name);
      return node.dependencies.filter((dep) => refCounts[dep]).length == 0;
    });

    // If we weren't able to find a package with no remaining dependencies,
    // then we've encountered a cycle in the dependency graph.  Run a
    // single-package batch with the package that has the most dependents.
    if (packages.length && !batch.length) {
      if (logger) {
        logger.warning(
          "Encountered a cycle in the dependency graph. This may cause instability!"
        );
      }

      batch.push(packages.reduce((a, b) => (
        (refCounts[a.name] || 0) > (refCounts[b.name] || 0) ? a : b
      )));
    }

    batches.push(batch);

    batch.forEach((pkg) => {
      delete refCounts[pkg.name];
      packages.splice(packages.indexOf(pkg), 1);
    });
  }

  return batches;
}

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
      const graph = PackageUtilities.getPackageGraph(this.packages);
      const concat = (a, b) => a.concat(b);

      const packageWithDeps = packageGraphNode =>
        packageGraphNode.dependencies
          .map(pkgName => graph.get(pkgName))
          .map(packageWithDeps)
          .reduce(concat, []).concat([packageGraphNode]);

      const unique =
        (value, index, self) => 
          self.map(pkg => pkg.name).indexOf(value.name) === index;

      this.packagesWithScript = this.packagesWithScript
        .map(pkg => graph.get(pkg.name))
        .map(packageWithDeps)
        .reduce(concat, [])
        .map(graphNode => graphNode.package)
        .filter(unique);
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

/*
 * Make a simple CLI runner of the SortedRunCommand.
 */
program
  .version('0.0.0')
  .arguments('<npm-command> [package]')
  .option('-t, --tree', 'Run command on dependencies first')
  .action((cmd, pkg) => {
    const flags = {
      scope: pkg,
      withDeps: program.tree,
    };

    const lernaCommand = new SortedRunCommand([cmd], flags);

    // extend path with root-level node_modules to access build tools
    // binaries
    process.env['PATH'] = path.join(__dirname, 'node_modules', '.bin') +
      ':' + process.env['PATH'];

    lernaCommand.run();
  });

program.parse(process.argv);
if (program.args.length === 0) {
  console.log(program.help());
}
