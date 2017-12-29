import * as R from 'ramda';
import * as Utils from './utils';
import { def } from './types';

export const createComment = def(
  'createComment :: Position -> Size -> String -> Comment',
  (position, size, content) => ({
    id: Utils.generateId(),
    position,
    size,
    content,
  })
);

export const getCommentId = def(
  'getCommentId :: Comment -> CommentId',
  R.prop('id')
);

export const setCommentId = def(
  'setCommentId :: CommentId -> Comment -> Comment',
  R.assoc('id')
);

export const getCommentPosition = def(
  'getCommentPosition :: Comment -> Position',
  R.prop('position')
);

export const setCommentPosition = def(
  'setCommentPosition :: Position -> Comment -> Comment',
  R.assoc('position')
);

export const getCommentSize = def(
  'getCommentSize :: Comment -> Size',
  R.prop('size')
);

export const setCommentSize = def(
  'setCommentSize :: Size -> Comment -> Comment',
  R.assoc('size')
);

export const getCommentContent = def(
  'getCommentContent :: Comment -> String',
  R.prop('content')
);

export const setCommentContent = def(
  'setCommentContent :: String -> Comment -> Comment',
  R.assoc('content')
);
