import path from 'path';
import R from 'ramda';
import * as XP from 'xod-project';

import { def } from './types';

export const fsSafeName = XP.toIdentifier;

export const getProjectFileContents = def(
  'getProjectFileContents :: Project -> ProjectFileContents',
  R.dissoc('patches')
);

export const getProjectPath = def(
  'getProjectPath :: Project -> Path',
  R.pipe(
    XP.getProjectName,
    fsSafeName,
    name => `.${path.sep}${name}`
  )
);

export const getPatchFolderName = def(
  'getPatchFolderName :: Patch -> Path',
  R.pipe(XP.getPatchPath, XP.getBaseName)
);

export const getPatchFileContents = def(
  'getPatchFileContents :: Patch -> PatchFileContents',
  R.compose(
    R.dissoc('impls'),
    R.dissoc('path'),
    R.evolve({
      nodes: R.values,
      links: R.values,
    })
  )
);

const filePath = R.unapply(R.join(path.sep));

const getXodpFile = def(
  'getXodpFile :: Path -> Patch -> PatchFile',
  (projectPath, patch) => ({
    path: filePath(projectPath, getPatchFolderName(patch), 'patch.xodp'),
    content: getPatchFileContents(patch),
  })
);

const getImplFiles = def(
  'getImplFiles :: Path -> Patch -> [PatchImplFile]',
  (projectPath, patch) => R.compose(
    R.map(
      ([implName, content]) => ({
        path: filePath(projectPath, getPatchFolderName(patch), implName),
        content,
      })
    ),
    R.toPairs,
    R.prop('impls')
  )(patch)
);

// :: Project -> [ { path :: String, content :: Object } ]
export const arrangeByFiles = def(
  'arrangeByFiles :: Project -> [AnyXodFile]',
  (project) => {
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
  }
);
