import * as R from 'ramda';
import str2ab from 'string-to-arraybuffer';

const artifactToOptions = R.curry((artifactName, suite, opts) => {
  const path = ['artifacts', artifactName];
  if (R.pathSatisfies(R.isNil, path, suite)) return opts;
  return R.compose(R.assoc(artifactName, R.__, opts), str2ab, R.path(path))(
    suite
  );
});

const prepareModuleOptions = compiledSuite =>
  R.compose(
    artifactToOptions('emterpreterFile', compiledSuite),
    artifactToOptions('wasmBinary', compiledSuite),
    R.merge({
      noFSInit: false,
      noExitRuntime: false,
      arguments: ['-e'],
    })
  )(compiledSuite.options);

export default prepareModuleOptions;
