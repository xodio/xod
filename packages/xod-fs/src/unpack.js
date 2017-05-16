import R from 'ramda';
import path from 'path';
import * as XP from 'xod-project';

import { IMPL_FILENAMES } from './loadLibs';

export const fsSafeName = XP.toIdentifier;

const getLibNames = R.compose(
  R.uniq,
  R.map(XP.getLibraryName),
  R.reject(XP.isPathBuiltIn),
  R.map(XP.getPatchPath),
  XP.listLibraryPatches
);

export const getProjectFileContents = project =>
  R.compose(
    R.assoc('libs', getLibNames(project)),
    R.dissoc('patches')
  )(project);


export const getProjectPath = R.pipe(
  XP.getProjectName,
  fsSafeName,
  name => `.${path.sep}${name}`
);

export const getPatchFolderName = R.pipe(XP.getPatchPath, XP.getBaseName);

const removeIds = R.map(R.dissoc('id'));

export const getXodpContents = R.compose(
  R.dissoc('impls'),
  R.dissoc('path'),
  R.evolve({
    nodes: removeIds,
    links: removeIds,
  })
);

const filePath = R.unapply(R.join(path.sep));

const getXodpFile = R.curry((projectPath, patch) => ({
  path: filePath(projectPath, getPatchFolderName(patch), 'patch.xodp'),
  content: getXodpContents(patch),
}));

const getImplFiles = R.curry(
  (projectPath, patch) => R.compose(
    R.map(
      ([implName, content]) => ({
        path: filePath(projectPath, getPatchFolderName(patch), IMPL_FILENAMES[implName]),
        content,
      })
    ),
    R.toPairs,
    R.prop('impls')
  )(patch)
);

// :: Project -> [ { path :: String, content :: Object } ]
export const arrangeByFiles = (project) => {
  const projectPath = getProjectPath(project);
  const mainFiles = [{
    path: filePath(projectPath, 'project.xod'),
    content: getProjectFileContents(project),
  }];

  const patchFiles = R.compose(
    R.chain(
      R.converge(
        R.prepend,
        [
          getXodpFile(projectPath),
          getImplFiles(projectPath),
        ]
      )
    ),
    XP.listLocalPatches
  )(project);

  return R.concat(
    mainFiles,
    patchFiles
  );
};
