import R from 'ramda';
import path from 'path';
import os from 'os';
import cpp from 'child-process-promise';
import fetch from 'node-fetch';

import { DEFAULT_UPLOAD_CONFIG_URL, RETRY_DELAYS } from './constants';
import { retryOrFail } from './utils';
import {
  flushSerialBuffer,
  touchPort1200,
  waitNewPort,
  listPorts,
} from './serialport';

// UploadConfig :: { exe: StrMap String, tool: String, toolUrl: StrMap Url, cmdTemplate: String }
// LocalConfig :: { toolPath: Path, artifactPath: Path, port: String }

const rejectFetchResult = (res, payload) =>
  Object.assign(
    new Error(res.statusText),
    {
      status: res.status,
      statusText: res.statusText,
    },
    payload
  );

// :: () -> URL
const getUploadConfigUrl = () =>
  process.env.XOD_CLOUD_UPLOAD_CONFIG_URL || DEFAULT_UPLOAD_CONFIG_URL;

const fetchUploadConfig = boardId =>
  fetch(`${getUploadConfigUrl()}${boardId}`).then(res => {
    if (res.status === 200) {
      return res.json();
    }
    return Promise.reject(res);
  });

// :: String -> Promise UploadConfig Error
export const getUploadConfig = boardId =>
  fetchUploadConfig(boardId).catch(
    retryOrFail(
      RETRY_DELAYS,
      res => res.status && res.status !== 200 && res.status !== 503,
      res => (res.status ? rejectFetchResult(res, { boardId }) : res),
      () => fetchUploadConfig(boardId)
    )
  );

// :: String -> UploadConfig -> Path
const getToolExe = R.compose(
  path.normalize,
  R.path(['tool', 'exe', os.platform()])
);

// :: UploadConfig -> LocalConfig -> Path
const getToolPath = R.curry((uploadConfig, localConfig) =>
  path.normalize(
    `${localConfig.toolPath}/${uploadConfig.tool.name}/${
      uploadConfig.tool.version
    }/`
  )
);

// :: UploadConfig -> String
export const getToolName = R.path(['tool', 'name']);

// :: UploadConfig -> String
export const getToolVersion = R.path(['tool', 'version']);

// :: UploadConfig -> Path
export const getToolVersionPath = R.converge(path.join.bind(path), [
  getToolName,
  getToolVersion,
]);

// :: UploadConfig -> URL
export const getToolUrl = R.path(['tool', 'url', os.platform()]);

// :: UploadConfig -> LocalConfig -> String
export const composeCommand = R.curry((uploadConfig, localConfig) => {
  const pattern = R.prop('cmdTemplate', uploadConfig);
  const toolExec = getToolExe(uploadConfig);
  const toolPath = getToolPath(uploadConfig, localConfig);

  return R.compose(
    R.replace(/\{\/\}/g, path.sep),
    R.replace(/\{ARTIFACT_PATH\}/g, localConfig.artifactPath),
    R.replace(/\{PORT\}/g, localConfig.port),
    R.replace(/\{TOOL_EXEC\}/g, toolExec),
    R.replace(/\{TOOL_PATH\}/g, toolPath)
  )(pattern);
});

// :: ChildProcessResult -> { exitCode: Number, stdout: String, stderr: String }
const normalizeChildProcessResult = r => ({
  exitCode: r.childProcess.exitCode,
  stdout: r.stdout,
  stderr: r.stderr,
});

// :: String -> Promise { exitCode: Number, stdout: String, stderr: String } Error
export const runCommand = cmd =>
  cpp.exec(cmd).then(normalizeChildProcessResult);

// :: UploadConfig -> LocalConfig -> Promise [UploadConfig, LocalConfig] Error
const prepareBoardUpload = async (uploadConfig, localConfig) => {
  const portName = localConfig.port;

  if (!uploadConfig.disableFlushing) {
    await flushSerialBuffer(portName);
  }

  const ports = await listPorts();

  if (uploadConfig.touch1200bps) {
    await touchPort1200(portName);
  }
  if (!uploadConfig.waitForPort) {
    return [uploadConfig, localConfig];
  }

  const uploadPortName = await waitNewPort(ports);
  const newLocalConfig = R.assoc('port', uploadPortName, localConfig);
  return [uploadConfig, newLocalConfig];
};

// :: UploadConfig -> LocalConfig -> Promise { exitCode: Number, stdout: String, stderr: String }
export const upload = R.composeP(
  runCommand,
  ([uploadCfg, localCfg]) => composeCommand(uploadCfg, localCfg),
  prepareBoardUpload
);
