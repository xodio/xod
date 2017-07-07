import R from 'ramda';
import path from 'path';
import fs from 'fs-extra';
import * as XF from 'xod-func-tools';

import { def } from './types';
import { readDir } from './read';
import { BASE64_EXTNAMES, ATTACHMENT_EXTNAMES } from './constants';
import {
  extAmong,
} from './utils';

const isBase64Extname = def(
  'isBase64Extname :: Path -> Boolean',
  extAmong(BASE64_EXTNAMES)
);

const getEncodingByExtname = def(
  'getEncodingByExtname :: Path -> String',
  R.ifElse(
    isBase64Extname,
    R.always('base64'),
    R.always('utf8')
  )
);

const encodeBuffer = def(
  'encodeBuffer :: Path -> Buffer -> String',
  (filePath, buffer) => R.compose(
    encoding => buffer.toString(encoding),
    () => getEncodingByExtname(filePath)
  )()
);

// Returns Patch with glued attachments
// :: Path -> Promise Patch Error
export const loadAttachmentFiles = R.curry(
  (patchDirPath, data) => R.composeP(
    R.assoc('attachments', R.__, data), // TODO: replace with xod-project function
    XF.allPromises,
    R.map(
      filePath => R.composeP(
        R.applySpec({
          filename: () => path.relative(patchDirPath, filePath),
          encoding: () => getEncodingByExtname(filePath),
          content: R.identity,
        }),
        encodeBuffer(filePath),
        fs.readFile
      )(filePath)
    ),
    R.filter(extAmong(ATTACHMENT_EXTNAMES)),
    readDir
  )(patchDirPath)
);

export default loadAttachmentFiles;
