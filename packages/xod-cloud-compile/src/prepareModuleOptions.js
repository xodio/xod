import * as R from 'ramda';

export default compiledSuite =>
  R.compose(
    R.merge({
      noFSInit: false,
      noExitRuntime: false,
      arguments: ['-e'],
    })
  )(compiledSuite.options);
