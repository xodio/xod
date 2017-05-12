import R from 'ramda';
import path from 'path';
import * as XP from 'xod-project';

import { IMPL_FILENAMES } from './loadLibs';

// "--  Awesome name  --" -> "awesome-name"
export const fsSafeName = R.compose(
  R.replace(/-$/g, ''),
  R.replace(/^-/g, ''),
  R.replace(/(-)\1+/g, '-'),
  R.replace(/[^a-z0-9]/gi, '-'),
  R.toLower
);

const getLibNames = R.compose(
  R.reject(R.equals('xod/built-in')), // TODO: hardcoded magic name
  R.uniq,
  R.map(R.pipe(XP.getPatchPath, XP.getLibraryName)),
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

// :: Project -> [ { path :: String, content :: Object } ]
export const arrangeByFiles = (project) => {
  const projectPath = getProjectPath(project);
  const mainFiles = [{
    path: filePath(projectPath, 'project.xod'),
    content: getProjectFileContents(project),
  }];

  const patchFiles = R.compose(
    R.chain(
      patch => [
        {
          path: filePath(projectPath, getPatchFolderName(patch), 'patch.xodp'),
          content: getXodpContents(patch),
        },
      ].concat(
        R.toPairs(patch.impls).map(([implName, content]) => ({
          path: filePath(projectPath, getPatchFolderName(patch), IMPL_FILENAMES[implName]),
          content,
        }))
      )
    ),
    XP.listLocalPatches
  )(project);

  return R.concat(
    mainFiles,
    patchFiles
  );
};
