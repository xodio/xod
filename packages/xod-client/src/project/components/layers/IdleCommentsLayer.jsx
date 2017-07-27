import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import { LAYER } from '../../../editor/constants';

import { isCommentSelected } from '../../../editor/utils';

import SVGLayer from './SVGLayer';
import Comment from '../Comment';

const IdleCommentsLayer = ({
  comments,
  draggedCommentId,
  selection,
  onMouseDown,
  onResizeHandleMouseDown,
  onFinishEditing,
}) => (
  <SVGLayer
    name={LAYER.COMMENTS}
    className="IdleCommentsLayer"
  >
    {R.compose(
      R.map(
        comment =>
          <Comment
            hidden={comment.id === draggedCommentId}
            key={comment.id}
            id={comment.id}
            content={comment.content}
            position={comment.position}
            size={comment.size}
            isSelected={isCommentSelected(selection, comment.id)}
            onMouseDown={onMouseDown}
            onResizeHandleMouseDown={onResizeHandleMouseDown}
            onFinishEditing={onFinishEditing}
          />
      ),
      R.values
    )(comments)}
  </SVGLayer>
);

IdleCommentsLayer.propTypes = {
  comments: PropTypes.objectOf(PropTypes.object),
  selection: PropTypes.arrayOf(PropTypes.object),
  draggedCommentId: PropTypes.string,
  onMouseDown: PropTypes.func,
  onResizeHandleMouseDown: PropTypes.func,
  onFinishEditing: PropTypes.func,
};

export default IdleCommentsLayer;
