
const path = require('path');
const async = require('async');
const PackageUtilities = require('lerna/lib/PackageUtilities');
const RunCommand = require('lerna/lib/commands/RunCommand');

//const packages = PackageUtilities.getPackages(PackageUtilities.getPackagesPath(__dirname));
//console.log(JSON.stringify(topologicallyBatchPackages(packages), null, 2));


// https://github.com/lerna/lerna/issues/342
// https://github.com/seansfkelley/lerna/commit/4e3e4789a4d627f90d8eb899dd9514818105aa7b
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

function arrayConcat(a, b) {
  return a.concat(b);
}

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

      function packageWithDeps(packageGraphNode) {
        return packageGraphNode.dependencies
          .map(pkgName => graph.get(pkgName))
          .map(packageWithDeps)
          .reduce(arrayConcat, []).concat([packageGraphNode]);
      }

      this.packagesWithScript = this.packagesWithScript
        .map(pkg => graph.get(pkg.name))
        .map(packageWithDeps)
        .reduce(arrayConcat, [])
        .map(graphNode => graphNode.package)
        .filter((value, index, self) => self.map(pkg => pkg.name).indexOf(value.name) === index);
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

process.env['PATH'] = path.join(__dirname, 'node_modules', '.bin') + ':' + process.env['PATH'];

const cmd = new SortedRunCommand(['build'], {
  scope: 'xod-client-browser',
  withDeps: true,
});

cmd.run();
