import path from 'path';
import * as R from 'ramda';
import * as XP from 'xod-project';

import { def } from './types';
import {
  convertProjectToProjectFileContents,
  convertPatchToPatchFileContents,
} from './convertTypes';

export const fsSafeName = XP.toIdentifier;

export const getPatchFolderName = def(
  'getPatchFolderName :: Patch -> Path',
  R.pipe(XP.getPatchPath, XP.getBaseName)
);

const filePath = R.unapply(R.join(path.sep));

const getXodpFile = def('getXodpFile :: Patch -> PatchFile', patch => ({
  path: filePath(getPatchFolderName(patch), 'patch.xodp'),
  content: convertPatchToPatchFileContents(patch),
}));

const getAttachmentFiles = def(
  'getAttachmentFiles :: Patch -> [AttachmentFile]',
  patch =>
    R.compose(
      R.map(({ filename, encoding, content }) => ({
        path: filePath(getPatchFolderName(patch), filename),
        encoding,
        content,
      })),
      R.prop('attachments')
    )(patch)
);

export const arrangePatchByFiles = def(
  'arrangePatchByFiles :: Patch -> [AnyXodFile]',
  R.converge(R.unapply(R.unnest), [
    R.compose(R.of, getXodpFile),
    getAttachmentFiles,
  ])
);

// :: Project -> [ { path :: String, content :: Object } ]
export const arrangeByFiles = def(
  'arrangeByFiles :: Project -> [AnyXodFile]',
  project => {
    const mainFiles = [
      {
        path: filePath('project.xod'),
        content: convertProjectToProjectFileContents(project),
      },
    ];
    const patchFiles = R.compose(
      R.chain(arrangePatchByFiles),
      XP.listLocalPatches
    )(project);

    return R.concat(mainFiles, patchFiles);
  }
);
