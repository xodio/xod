import R from 'ramda';
import path from 'path';
import * as XP from 'xod-project';

import { fsSafeName } from './unpack';

export const getMeta = R.applySpec({
  name: XP.getProjectName,
  author: R.pipe(XP.getProjectAuthors, R.join(', ')),
});

const getLibNames = R.compose(
  R.uniq,
  R.map(R.pipe(XP.getPatchPath, XP.getLibraryName)),
  XP.listLibraryPatches
);

export const getProjectFileContents = R.applySpec({
  meta: getMeta,
  libs: getLibNames,
});

export const getProjectPathV2 = R.pipe(
  XP.getProjectName,
  fsSafeName,
  name => `.${path.sep}${name}`
);

export const getPatchFolderName = R.pipe(XP.getPatchPath, XP.getBaseName);

// :: Pin -> FsPin
const convertPin = R.applySpec({
  key: XP.getPinKey,
  index: XP.getPinOrder,
  direction: XP.getPinDirection,
  type: XP.getPinType,
  pinLabel: XP.getPinLabel, // TODO: v2 equivalent?
  label: XP.getPinLabel,
  description: XP.getPinDescription,
});

export const getXodmContents = R.applySpec({
  pins: R.pipe(
    XP.listPins,
    R.map(convertPin),
    R.indexBy(R.prop('key'))
  ),
});

const convertNode = R.applySpec({
  id: XP.getNodeId,
  position: XP.getNodePosition,
  pins: R.pipe( // TODO: in the middle of migration
    R.prop('pins'),
    R.map(R.applySpec({ // TODO: needs clarification(deprecation of 'curried' prop etc)
      injected: R.F,
      value: R.prop('value'),
    }))
  ),
  properties: R.always({}), // TODO: label? description?
  typeId: XP.getNodeType,
});

const convertLink = link => ({
  id: XP.getLinkId(link),
  pins: [
    {
      nodeId: XP.getLinkInputNodeId(link),
      pinKey: XP.getLinkInputPinKey(link),
    },
    {
      nodeId: XP.getLinkOutputNodeId(link),
      pinKey: XP.getLinkOutputPinKey(link),
    },
  ],
});

export const getXodpContents = R.applySpec({
  nodes: R.pipe(
    XP.listNodes,
    R.map(convertNode),
    R.indexBy(R.prop('id'))
  ),
  links: R.pipe(
    XP.listLinks,
    R.map(convertLink),
    R.indexBy(R.prop('id'))
  ),
});

const filePath = R.unapply(R.join(path.sep));

// :: Project -> [ { path :: String, content :: Object } ]
export const arrangeByFilesV2 = (projectV2) => {
  const projectPath = getProjectPathV2(projectV2);
  const mainFiles = [{
    path: filePath(projectPath, 'project.xod'),
    content: getProjectFileContents(projectV2),
  }];

  const patchFiles = R.compose(
    R.chain(
      patch => [
        {
          path: filePath(projectPath, getPatchFolderName(patch), 'patch.xodm'),
          content: getXodmContents(patch),
        },
        {
          path: filePath(projectPath, getPatchFolderName(patch), 'patch.xodp'),
          content: getXodpContents(patch),
        },
      ]
    ),
    XP.listLocalPatches
  )(projectV2);

  return R.concat(
    mainFiles,
    patchFiles
  );
};
