import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import pureDeepEqual from '../../../utils/pureDeepEqual';

import { isCommentSelected } from '../../../editor/utils';

import Comment from '../Comment';

const CommentsLayer = ({
  comments,
  selection,
  areDragged,
  onMouseDown,
  onMouseUp,
  onResizeHandleMouseDown,
  onFinishEditing,
}) => (
  <g className="CommentsLayer">
    {R.compose(
      R.map(comment => (
        <Comment
          key={comment.id}
          id={comment.id}
          content={comment.content}
          position={comment.position}
          hidden={comment.hidden}
          size={comment.size}
          isSelected={isCommentSelected(selection, comment.id)}
          isDragged={areDragged}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onResizeHandleMouseDown={onResizeHandleMouseDown}
          onFinishEditing={onFinishEditing}
        />
      )),
      R.values
    )(comments)}
  </g>
);

CommentsLayer.defaultProps = {
  areDragged: false,
};

CommentsLayer.propTypes = {
  comments: PropTypes.objectOf(PropTypes.object),
  selection: PropTypes.arrayOf(PropTypes.object),
  areDragged: PropTypes.bool,
  onMouseDown: PropTypes.func,
  onMouseUp: PropTypes.func,
  onResizeHandleMouseDown: PropTypes.func,
  onFinishEditing: PropTypes.func,
};

export default pureDeepEqual(CommentsLayer);
