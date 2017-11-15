import path from 'path';
import R from 'ramda';
import * as XP from 'xod-project';

import { def } from './types';
import {
  convertProjectToProjectFileContents,
  convertPatchToPatchFileContents,
} from './convertTypes';

export const fsSafeName = XP.toIdentifier;

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

const filePath = R.unapply(R.join(path.sep));

const getXodpFile = def(
  'getXodpFile :: Path -> Patch -> PatchFile',
  (projectPath, patch) => ({
    path: filePath(projectPath, getPatchFolderName(patch), 'patch.xodp'),
    content: convertPatchToPatchFileContents(patch),
  })
);

const getAttachmentFiles = def(
  'getAttachmentFiles :: Path -> Patch -> [AttachmentFile]',
  (projectPath, patch) => R.compose(
    R.map(
      ({ filename, encoding, content }) => ({
        path: filePath(projectPath, getPatchFolderName(patch), filename),
        encoding,
        content,
      })
    ),
    R.prop('attachments')
  )(patch)
);

export const arrangePatchByFiles = def(
  'arrangePatchByFiles :: Path -> Patch -> [AnyXodFile]',
  (projectDir, patch) => R.converge(
    R.unapply(R.unnest),
    [
      R.compose(R.of, getXodpFile(projectDir)),
      getAttachmentFiles(projectDir),
    ]
  )(patch)
);

// :: Project -> [ { path :: String, content :: Object } ]
export const arrangeByFiles = def(
  'arrangeByFiles :: Project -> [AnyXodFile]',
  (project) => {
    const projectPath = getProjectPath(project);
    const mainFiles = [{
      path: filePath(projectPath, 'project.xod'),
      content: convertProjectToProjectFileContents(project),
    }];
    const patchFiles = R.compose(
      R.chain(arrangePatchByFiles(projectPath)),
      XP.listLocalPatches
    )(project);

    return R.concat(
      mainFiles,
      patchFiles
    );
  }
);
