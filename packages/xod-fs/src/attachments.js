import * as R from 'ramda';
import path from 'path';
import fs from 'fs-extra';
import * as XF from 'xod-func-tools';
import * as XP from 'xod-project';

import { def } from './types';
import { readDir } from './read';
import { BASE64_EXTNAMES, ATTACHMENT_EXTNAMES } from './constants';
import { extAmong } from './utils';

const isBase64Extname = def(
  'isBase64Extname :: Path -> Boolean',
  extAmong(BASE64_EXTNAMES)
);

const getEncodingByExtname = def(
  'getEncodingByExtname :: Path -> String',
  R.ifElse(isBase64Extname, R.always('base64'), R.always('utf8'))
);

const encodeBuffer = def(
  'encodeBuffer :: Path -> Buffer -> String',
  (filePath, buffer) =>
    R.compose(encoding => buffer.toString(encoding), getEncodingByExtname)(
      filePath
    )
);

// Loads and returns a single Attachment
// :: Path -> Path -> Promise Attachment Error
const loadAttachment = R.curry((patchDirPath, filePath) =>
  R.composeP(
    content => ({
      filename: path.relative(patchDirPath, filePath),
      encoding: getEncodingByExtname(filePath),
      content,
    }),
    encodeBuffer(filePath),
    fs.readFile
  )(filePath)
);

// Returns Patch with glued attachments
// :: Path -> Promise Patch Error
export const loadAttachments = R.curry((patchDirPath, data) =>
  R.composeP(
    XP.setPatchAttachments(R.__, data),
    XF.allPromises,
    R.map(loadAttachment(patchDirPath)),
    R.filter(extAmong(ATTACHMENT_EXTNAMES)),
    readDir
  )(patchDirPath)
);

export default loadAttachments;
