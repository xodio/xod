import R from 'ramda';
import { def } from './types';
import { IMPL_FILENAME } from './constants';

export const createAttachment = def(
  'createAttachment :: String -> String -> String -> Attachment',
  (filename, encoding, content) => ({
    filename,
    encoding,
    content,
  })
);

export const createImplAttachment = def(
  'createImplAttachment :: Source -> Attachment',
  content => createAttachment(IMPL_FILENAME, 'utf-8', content)
);

export const isImplAttachment = def(
  'isImplAttachment :: Attachment -> Boolean',
  R.propEq('filename', IMPL_FILENAME)
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
