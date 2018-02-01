import * as R from 'ramda';
import { statSync } from 'fs';
import { resolve, dirname } from 'path';
import { rejectWithCode } from 'xod-func-tools';

import {
  isBasename,
  isExtname,
  isDirectory,
} from './utils';
import * as ERROR_CODES from './errorCodes';

function getParentDirectories(path) {
  function loop(currentPath, parentDirectories) {
    let stats;
    try { stats = statSync(currentPath); } catch (error) { stats = null; }
    if (stats && stats.isDirectory()) parentDirectories.push(currentPath);
    const parentPath = resolve(currentPath, '..');
    if (parentPath === currentPath) return parentDirectories;
    return loop(parentPath, parentDirectories);
  }

  return loop(resolve(process.cwd(), path), []);
}

export function isWorkspaceDir(path) {
  try {
    const xodworkspace = resolve(process.cwd(), path, '.xodworkspace');
    return statSync(xodworkspace).isFile();
  } catch (error) {
    return false;
  }
}

function isProjectDir(path) {
  try {
    const projectXod = resolve(process.cwd(), path, 'project.xod');
    return statSync(projectXod).isFile();
  } catch (error) {
    return false;
  }
}

export function findClosestWorkspaceDir(path) {
  return new Promise((resolve$, reject) => {
    const closestWorkspaceDir = getParentDirectories(path).find(isWorkspaceDir);
    if (closestWorkspaceDir) return resolve$(closestWorkspaceDir);
    return reject(new Error(`could not find workspace directory around "${path
      }". Workspace directory must contain ".xodworkspace" file.`));
  });
}

export function findClosestProjectDir(path) {
  return new Promise((resolve$, reject) => {
    const closestProjectDir = getParentDirectories(path).find(isProjectDir);
    if (closestProjectDir) return resolve$(closestProjectDir);
    return reject(new Error(`could not find project directory around "${path
      }". Project directory must contain "project.xod" file.`));
  });
}


// :: Path -> Promise Path Error
export const getPathToXodProject = R.composeP(
  R.cond([
    [
      isBasename('project.xod'),
      dirname,
    ],
    [
      isExtname('.xodball'),
      R.identity,
    ],
    [
      R.either(
        isBasename('patch.xodp'),
        isDirectory
      ),
      findClosestProjectDir,
    ],
    [
      R.T,
      filePath => rejectWithCode(
        ERROR_CODES.TRIED_TO_OPEN_NOT_XOD_FILE,
        new Error(`Tried to open not a xod file: ${filePath}`)
      ),
    ],
  ]),
  Promise.resolve.bind(Promise)
);
