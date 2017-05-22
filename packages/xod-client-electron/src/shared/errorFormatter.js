import R from 'ramda';
import { ERROR_CODES as XFS_EC } from 'xod-fs';
import * as EC from './errorCodes';

const UNKNOWN_ERROR = err => `Unknown error occurred: ${err}`;

const ERROR_FORMATTERS = {
  [EC.TRANSPILE_ERROR]: err => `Error occurred during transpilation: ${err}`,

  [EC.PORT_NOT_FOUND]: err => `Could not find Arduino device on opened ports: ${R.map(R.prop('comName'), err.ports)}`,
  [EC.IDE_NOT_FOUND]: err => `Could not find Arduino IDE at ${err.path}`,
  [EC.PACKAGES_NOT_FOUND]: err => `Could not find Arduino packages at ${err.path}`,
  [EC.UPLOAD_ERROR]: err => `Error occured during uploading: ${err}`,
  [EC.INDEX_LIST_ERROR]: err => `Could not connect to Arduino Packages Index at ${err.request.path}: ${err.error.message}`,
  [EC.INSTALL_PAV_ERROR]: err => `Could not install Arduino PAV: ${err}`,
  [EC.NO_INSTALLED_PAVS]: err => `Could not find or install Arduino PAV for PAB: ${R.values(err.pab)}`,

  [XFS_EC.INVALID_WORKSPACE_PATH]: err => `Invalid workspace path: "${err.path}" of type "${typeof err.path}"`,
  [XFS_EC.WORKSPACE_DIR_NOT_EMPTY]: err => `Workspace directory at ${err.path} is not empty`,
  [XFS_EC.WORKSPACE_DIR_NOT_EXIST_OR_EMPTY]: err => `Workspace directory at ${err.path} not exist or empty`,

  [XFS_EC.CANT_CREATE_WORKSPACE_FILE]: err => `Could not create workspace at ${err.path}: ${err.message}`,
  [XFS_EC.CANT_COPY_STDLIB]: err => `Could not copy stdlib at ${err.path}: ${err.message}`,
  [XFS_EC.CANT_COPY_DEFAULT_PROJECT]: err => `Could not copy default project at ${err.path}: ${err.message}`,
  [XFS_EC.CANT_ENUMERATE_PROJECTS]: err => `Could not enumerate projects at ${err.path}: ${err.message}`,
  [XFS_EC.CANT_SAVE_PROJECT]: err => `Could not save the project at ${err.path}: ${err.message}`,

  [EC.CANT_CREATE_NEW_PROJECT]: err => `Could not create a new project: ${err.message}`,
  [EC.CANT_OPEN_SELECTED_PROJECT]: err => `Could not open a selected project: ${err.message}`,
};

// :: Error -> String
export default R.compose(
  R.cond,
  R.append([R.T, UNKNOWN_ERROR]),
  R.map(R.over(R.lensIndex(0), R.propEq('errorCode'))),
  R.toPairs
)(ERROR_FORMATTERS);
