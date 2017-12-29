import * as R from 'ramda';
import path from 'path';
import cpp from 'child-process-promise';
import fse from 'fs-extra';

import * as Utils from './utils';

// =============================================================================
//
// Prepare command and build
//
// =============================================================================

export const composeCommand = (
  sketchFilePath,
  fqbn,
  packagesDir,
  librariesDir,
  buildDir,
  builderToolDir
) => {
  const builderExecFileName = (Utils.isWindows) ? 'arduino-builder.exe' : 'arduino-builder';
  const builderExec = path.join(builderToolDir, builderExecFileName);

  const builderHardware = path.join(builderToolDir, 'hardware');
  const builderTools = path.join(builderToolDir, 'tools');

  return [
    `"${builderExec}"`,
    `-hardware="${builderHardware}"`,
    `-hardware="${packagesDir}"`,
    `-libraries="${librariesDir}"`,
    `-tools="${builderTools}"`,
    `-tools="${packagesDir}"`,
    `-fqbn="${fqbn}"`,
    `-build-path="${buildDir}"`,
    `"${sketchFilePath}"`,
  ].join(' ');
};

// :: Path -> FQBN -> Path -> Path -> Path -> PortName -> Promise { exitCode, stdout, stderr } Error
export const build = R.curry(
  (sketchFilePath, fqbn, packagesDir, librariesDir, buildDir, builderToolDir) => {
    const cmd = composeCommand(
      sketchFilePath,
      fqbn,
      packagesDir,
      librariesDir,
      buildDir,
      builderToolDir
    );

    return fse.ensureDir(buildDir)
      .then(() => cpp.exec(cmd))
      .then(Utils.normalizeChildProcessResult);
  }
);
