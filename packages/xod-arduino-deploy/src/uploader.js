import * as R from 'ramda';
import path from 'path';
import cpp from 'child-process-promise';

import packageIndex from './packageIndex.json';
import * as Utils from './utils';
import { loadBoardPrefs } from './boardsParser';
import { build } from './builder';
import { flushSerialBuffer, touchPort1200, waitNewPort, listPorts } from './serialport';

// =============================================================================
//
// Tool specific commands
//
// =============================================================================

const bossacCommand = (opts) => {
  const { toolDirPath, sketchFileName, buildDir, boardPrefs, portName, debug = false } = opts;

  const toolExecFile = (Utils.isWindows) ? 'bossac.exe' : 'bossac';
  const toolExecPath = path.join(toolDirPath, toolExecFile);
  const artifactPath = path.join(buildDir, `${sketchFileName}.bin`);

  const verbose = (debug) ? ' -i -d' : '';

  return `"${toolExecPath}"${verbose} --port=${portName} -U ${boardPrefs.upload.native_usb} -e -w -b "${artifactPath}" -R`;
};

const avrdudeCommand = (opts) => {
  const { toolDirPath, sketchFileName, buildDir, boardPrefs, portName, debug = false } = opts;

  const toolExecFile = (Utils.isWindows) ? 'bin/avrdude.exe' : 'bin/avrdude';
  const toolExecPath = path.join(toolDirPath, toolExecFile);
  const configFile = path.join(toolDirPath, 'etc/avrdude.conf');
  const artifactPath = path.join(buildDir, `${sketchFileName}.hex`);

  const verbose = (debug) ? ' -v -v' : '';

  const mcu = (boardPrefs.build.emu) ? boardPrefs.build.emu.mcu : boardPrefs.build.mcu;

  return `"${toolExecPath}" -C "${configFile}"${verbose} -p ${mcu} -c ${boardPrefs.upload.protocol} -P ${portName} -b ${boardPrefs.upload.speed} -D "-Uflash:w:${artifactPath}:i"`;
};

const openocdCommand = (opts) => {
  const { toolDirPath, sketchFileName, buildDir, boardPrefs, platformDir, debug = false } = opts;

  const toolExecFile = (Utils.isWindows) ? 'bin/openocd.exe' : 'bin/openocd';
  const toolExecPath = path.join(toolDirPath, toolExecFile);
  const scriptsDir = path.join(toolDirPath, 'share/openocd/scripts');
  const buildVariant = path.join(
    platformDir,
    'variants',
    boardPrefs.build.variant,
    boardPrefs.build.openocdscript
  );
  const artifactPath = path.join(buildDir, `${sketchFileName}.bin`);

  const bootloaderSize = boardPrefs.bootloader.size || '0x2000';

  const verbose = (debug) ? ' -d2' : '';

  return `"${toolExecPath}"${verbose} -s "${scriptsDir}" -f "${buildVariant}" -c "telnet_port disabled; program ${artifactPath} verify reset ${bootloaderSize}; shutdown"`;
};

// =============================================================================
//
// Prepare command and upload
//
// =============================================================================

// :: Path -> FQBN -> Path -> Path -> PortName -> BoardPrefs -> String
export const composeCommand = R.curry(
  (sketchFilePath, fqbn, packagesDir, buildDir, boardPrefs, portName) => {
    const pab = Utils.parseFQBN(fqbn);
    const platformDir = Utils.getArchitectureDirectory(fqbn, packagesDir);

    const toolName = Utils.getBoardUploadTool(boardPrefs);
    const toolVersion = Utils.getToolVersion(fqbn, toolName, packageIndex);
    const toolsDir = Utils.getToolsDirectory(fqbn, packagesDir);
    const toolDirPath = Utils.getToolVersionDirectory(toolName, toolVersion, toolsDir);

    const sketchFileName = path.basename(sketchFilePath);

    switch (toolName) {
      case 'bossac':
        return bossacCommand({ toolDirPath, sketchFileName, buildDir, boardPrefs, portName });
      case 'avrdude':
        return avrdudeCommand({ toolDirPath, sketchFileName, buildDir, boardPrefs, portName });
      case 'openocd':
      case 'openocd-withbootsize':
        return openocdCommand({ toolDirPath, sketchFileName, buildDir, boardPrefs, platformDir });
      default: {
        throw new Error(`Architecture "${pab.architecture}" (${fqbn}) is not supported now. You can make a request to add it at https://forum.xod.io/`);
      }
    }
  }
);

// :: BoardPrefs -> Boolean
const getUploadBoolProp = R.curry(
  (propName, boardPrefs) => R.compose(
    R.equals('true'),
    R.pathOr('false', ['upload', propName])
  )(boardPrefs)
);

// :: PortName -> BoardPrefs -> Promise PortName Error
const prepareBoardUpload = async (portName, boardPrefs) => {
  if (!getUploadBoolProp('disable_flushing', boardPrefs)) {
    await flushSerialBuffer(portName);
  }

  const ports = await listPorts();

  if (getUploadBoolProp('use_1200bps_touch', boardPrefs)) {
    await touchPort1200(portName);
  }

  const protocol = R.path(['upload', 'protocol'], boardPrefs);
  const uploadPortName = (getUploadBoolProp('wait_for_upload_port', boardPrefs)) ?
    await waitNewPort(ports) : portName;

  return (protocol === 'sam-ba') ? path.basename(uploadPortName) : uploadPortName;
};

// :: Path -> FQBN -> Path -> Path -> PortName -> Promise { exitCode, stdout, stderr } Error
export const upload = R.curry(
  async (sketchFilePath, fqbn, packagesDir, buildDir, portName) => {
    const boardPrefs = await loadBoardPrefs(fqbn, packagesDir);
    const newPortName = await prepareBoardUpload(portName, boardPrefs);
    const cmd = composeCommand(
      sketchFilePath, fqbn, packagesDir, buildDir, boardPrefs, newPortName
    );
    const exec = await cpp.exec(cmd);
    return Utils.normalizeChildProcessResult(exec);
  }
);

// :: Path -> FQBN -> Path -> Path -> Path -> PortName -> Promise { exitCode, stdout, stderr } Error
export const buildAndUpload = R.curry(
  (sketchFilePath, fqbn, packagesDir, librariesDir, buildDir, portName, builderToolDir) =>
    build(sketchFilePath, fqbn, packagesDir, librariesDir, buildDir, builderToolDir)
      .then((buildResult) => {
        if (buildResult.exitCode !== 0) {
          return Promise.reject(Object.assign(new Error(buildResult.stderr), buildResult));
        }

        return upload(sketchFilePath, fqbn, packagesDir, buildDir, portName)
          .then((uploadResult) => {
            if (uploadResult.exitCode !== 0) {
              return Promise.reject(Object.assign(new Error(uploadResult.stderr), uploadResult));
            }

            return {
              exitCode: uploadResult.exitCode,
              stdout: [buildResult.stdout, uploadResult.stdout].join('\n'),
              stderr: [buildResult.stderr, uploadResult.stderr].join('\n'),
            };
          });
      })
);
