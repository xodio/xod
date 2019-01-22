import * as R from 'ramda';
import str2ab from 'string-to-arraybuffer';

const prepareModuleOptions = compiledSuite =>
  R.merge(
    {
      wasmBinary: str2ab(compiledSuite.artifacts.wasmBinary),
      noFSInit: false,
      noExitRuntime: false,
      arguments: ['-e'],
    },
    compiledSuite.options
  );

export default prepareModuleOptions;
