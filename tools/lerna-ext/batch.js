
const PackageUtilities = require('lerna/lib/PackageUtilities');

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
module.exports = function topologicallyBatchPackages(packagesToBatch) {
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
