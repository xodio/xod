import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import pureDeepEqual from '../../../utils/pureDeepEqual';
import { LAYER } from '../../../editor/constants';

import { isCommentSelected } from '../../../editor/utils';

import SVGLayer from './SVGLayer';
import Comment from '../Comment';

const IdleCommentsLayer = ({
  comments,
  selection,
  areDragged,
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
            key={comment.id}
            id={comment.id}
            content={comment.content}
            position={comment.position}
            size={comment.size}
            isSelected={isCommentSelected(selection, comment.id)}
            isDragged={areDragged}
            onMouseDown={onMouseDown}
            onResizeHandleMouseDown={onResizeHandleMouseDown}
            onFinishEditing={onFinishEditing}
          />
      ),
      R.values
    )(comments)}
  </SVGLayer>
);


IdleCommentsLayer.defaultProps = {
  areDragged: false,
};

IdleCommentsLayer.propTypes = {
  comments: PropTypes.objectOf(PropTypes.object),
  selection: PropTypes.arrayOf(PropTypes.object),
  areDragged: PropTypes.bool,
  onMouseDown: PropTypes.func,
  onResizeHandleMouseDown: PropTypes.func,
  onFinishEditing: PropTypes.func,
};

export default pureDeepEqual(IdleCommentsLayer);
