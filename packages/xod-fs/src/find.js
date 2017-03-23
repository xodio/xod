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

  return loop(path.resolve(__dirname, path$), []);
}

export function isWorkspaceDir(path$) {
  const path$$ = path.resolve(__dirname, path$, '.xodworkspace');
  try {
    return fs.statSync(path$$).isFile();
  } catch (error) {
    return false;
  }
}

export function isProjectDir(path$) {
  const path$$ = path.resolve(__dirname, path$, 'project.xod');
  try {
    return fs.statSync(path$$).isFile();
  } catch (error) {
    return false;
  }
}

export function findClosestWorkspaceDir(path$) {
  return getParentDirectories(path$).find(isWorkspaceDir);
}

export function findClosestProjectDir(path$) {
  return getParentDirectories(path$).find(isProjectDir);
}
