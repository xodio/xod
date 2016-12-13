
const PackageUtilities = require('lerna/lib/PackageUtilities');

/*
 * Returns list of `packages` extended with their dependencies (recursively)
 * among `allPackages` having `script` available in their package.json
 */
module.exports = function withDependencies(packages, allPackages, script) {
  const graph = PackageUtilities.getPackageGraph(allPackages);
  const concat = (a, b) => a.concat(b);

  const packageWithDeps = packageGraphNode =>
    packageGraphNode.dependencies
      .map(pkgName => graph.get(pkgName))
      .map(packageWithDeps)
      .reduce(concat, []).concat([packageGraphNode]);

  const unique =
    (value, index, self) => 
      self.map(pkg => pkg.name).indexOf(value.name) === index;

  return packages
    .map(pkg => graph.get(pkg.name))
    .map(packageWithDeps)
    .reduce(concat, [])
    .map(graphNode => graphNode.package)
    .filter(unique)
    .filter((pkg) => pkg.scripts && pkg.scripts[script]);
}
