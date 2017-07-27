import React from 'react';
import PropTypes from 'prop-types';

import SVGLayer from './SVGLayer';
import Comment from '../Comment';

class ManipulatedCommentLayer extends React.PureComponent {
  render() {
    const {
      comment,
      position,
      size,
    } = this.props;

    if (!comment) return null;

    return (
      <SVGLayer
        name="ManipulatedCommentLayer"
        className="ManipulatedCommentLayer"
      >
        <Comment
          key={`comment_${comment.id}`}
          id={comment.id}
          content={comment.content}
          position={position}
          size={size}
          isSelected
          isDragged
        />
      </SVGLayer>
    );
  }
}

ManipulatedCommentLayer.displayName = 'ManipulatedCommentLayer';

ManipulatedCommentLayer.propTypes = {
  comment: PropTypes.any,
  position: PropTypes.any,
  size: PropTypes.any,
};

export default ManipulatedCommentLayer;
