import fs from 'fs';
import path from 'path';

function getParentDirectories(path$) {
  function loop(currentPath, parentDirectories) {
    let stats;
    try { stats = fs.statSync(currentPath); } catch (error) { stats = null; }
    if (stats && stats.isDirectory()) {
      parentDirectories.push(currentPath);
    }
    const parentPath = path.resolve(currentPath, '..');
    if (parentPath === currentPath) return parentDirectories;
    return loop(parentPath, parentDirectories);
  }

  return loop(path.resolve(process.cwd(), path$), []);
}

function isWorkspaceDir(path$) {
  const path$$ = path.resolve(process.cwd(), path$, '.xodworkspace');
  try {
    return fs.statSync(path$$).isFile();
  } catch (error) {
    return false;
  }
}

function isProjectDir(path$) {
  const path$$ = path.resolve(process.cwd(), path$, 'project.xod');
  try {
    return fs.statSync(path$$).isFile();
  } catch (error) {
    return false;
  }
}

export function findClosestWorkspaceDir(path$) {
  return new Promise((resolve, reject) => {
    const closestWorkspaceDir = getParentDirectories(path$)
      .find(isWorkspaceDir);
    return closestWorkspaceDir
      ? resolve(closestWorkspaceDir)
      : reject(
        `could not find workspace directory around "${path$}".`
      );
  });
}

export function findClosestProjectDir(path$) {
  return new Promise((resolve, reject) => {
    const closestProjectDir = getParentDirectories(path$)
      .find(isProjectDir);
    return closestProjectDir
      ? resolve(closestProjectDir)
      : reject(
        `could not find project directory around "${path$}".`
      );
  });
}
