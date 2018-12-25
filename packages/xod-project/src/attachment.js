import * as R from 'ramda';
import { maybeProp, explodeMaybe } from 'xod-func-tools';
import { def } from './types';
import { MANAGED_ATTACHMENT_FILENAMES } from './constants';

export const createAttachment = def(
  'createAttachment :: String -> String -> String -> Attachment',
  (filename, encoding, content) => ({
    filename,
    encoding,
    content,
  })
);

export const createAttachmentManagedByMarker = def(
  'createAttachmentManagedByMarker :: PatchPath -> String -> Attachment',
  (markerName, content) =>
    createAttachment(
      R.compose(
        explodeMaybe(`${markerName} does not manage any attachments`),
        maybeProp
      )(markerName, MANAGED_ATTACHMENT_FILENAMES),
      'utf-8',
      content
    )
);

export const isAttachmentManagedByMarker = def(
  'isAttachmentManagedByMarker :: PatchPath -> Attachment -> Boolean',
  (markerName, attachment) =>
    R.propEq('filename', MANAGED_ATTACHMENT_FILENAMES[markerName], attachment)
);

export const getFilename = def(
  'getFilename :: Attachment -> String',
  R.prop('filename')
);

export const getContent = def(
  'getContent :: Attachment -> String',
  R.prop('content')
);

export const getEncoding = def(
  'getEncoding :: Attachment -> String',
  R.prop('encoding')
);
