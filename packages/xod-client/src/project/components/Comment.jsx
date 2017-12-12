import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import AutoLinkText from 'react-autolink-text2';
import classNames from 'classnames';

import { noop } from '../../utils/ramda';

import { NODE_CORNER_RADIUS } from '../nodeLayout';

const HANDLE_SIZE = 12;
const linkProps = { target: '_blank', rel: 'nofollow noopener' };

class Comment extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isEditing: false,
      editorValue: '',
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !R.eqBy(
      R.omit([
        'onMouseDown',
        'onMouseUp',
        'onResizeHandleMouseDown',
        'onFinishEditing',
      ]),
      nextProps,
      this.props
    ) || !R.equals(nextState, this.state);
  }

  onMouseDown = (event) => {
    if (!this.state.isEditing) {
      this.props.onMouseDown(event, this.props.id);
    }
  };

  onMouseUp = (event) => {
    if (!this.state.isEditing) {
      this.props.onMouseUp(event, this.props.id);
    }
  };

  onResizeHandleMouseDown = (event) => {
    event.stopPropagation();
    this.props.onResizeHandleMouseDown(event, this.props.id);
  };

  onEditorChange = (event) => {
    this.setState({ editorValue: event.target.value });
  };

  onEditorKeyDown = (event) => {
    const { key, metaKey, ctrlKey } = event;

    if (key === 'Enter' && (metaKey || ctrlKey)) {
      this.finishEditing();
    }

    if (key === 'Escape') {
      this.cancelEditing();
    }
  };

  beginEditing = () => {
    if (!this.state.isEditing) {
      this.setState({
        isEditing: true,
        editorValue: this.props.content,
      });
    }
  };

  finishEditing = () => {
    this.props.onFinishEditing(this.props.id, this.state.editorValue);
    this.setState({
      isEditing: false,
    });
  };

  cancelEditing = () => {
    this.setState({
      isEditing: false,
    });
  };

  render() {
    const {
      id,
      content,
      position,
      size,
      isSelected,
      isDragged,
      hidden,
    } = this.props;

    const {
      isEditing,
      editorValue,
    } = this.state;

    const cls = classNames('Comment', {
      'is-selected': isSelected,
      'is-dragged': isDragged,
      'is-editing': isEditing,
      'is-hidden': hidden,
    });

    const maskId = `comment-mask-${id}${isDragged ? '-dragged' : ''}`;

    const bodyRectProps = {
      rx: NODE_CORNER_RADIUS,
      ry: NODE_CORNER_RADIUS,
    };

    return (
      <g
        className={cls}
        onMouseDown={this.onMouseDown}
        onMouseUp={this.onMouseUp}
        onDoubleClick={this.beginEditing}
      >
        <clipPath id={maskId}>
          <rect
            className="mask"
            {...position}
            {...size}
            {...bodyRectProps}
          />
        </clipPath>
        <rect
          {...position}
          {...size}
          className="body"
          clipPath={`url(#${maskId})`}
        />
        <path
          clipPath={`url(#${maskId})`}
          className="CommentResizeHandle"
          d={`
              M${position.x + size.width} ${position.y + size.height}
              v ${-HANDLE_SIZE}
              l ${-HANDLE_SIZE} ${HANDLE_SIZE}
              Z
            `}
        />
        <rect
          className="outline"
          {...position}
          {...size}
          {...bodyRectProps}
        />
        <foreignObject {...size} {...position}>
          <div className="container" xmlns="http://www.w3.org/1999/xhtml">
            {isEditing ? (
              <textarea
                className="content editor"
                onChange={this.onEditorChange}
                onKeyDown={this.onEditorKeyDown}
                onBlur={this.finishEditing}
                value={editorValue}
                autoFocus
              />
            ) : (
              <div className="content viewer">
                <AutoLinkText
                  text={content}
                  linkProps={linkProps}
                />
              </div>
            )}
          </div>
        </foreignObject>
        <rect
          className="resizeHandleOverlay"
          onMouseDown={this.onResizeHandleMouseDown}
          x={(position.x + size.width) - HANDLE_SIZE}
          y={(position.y + size.height) - HANDLE_SIZE}
          width={HANDLE_SIZE}
          height={HANDLE_SIZE}
        />
      </g>
    );
  }
}

Comment.propTypes = {
  id: PropTypes.string.isRequired,
  content: PropTypes.string.isRequired,
  size: PropTypes.any.isRequired,
  position: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  isDragged: PropTypes.bool,
  hidden: PropTypes.bool,
  onMouseDown: PropTypes.func,
  onMouseUp: PropTypes.func,
  onResizeHandleMouseDown: PropTypes.func,
  onFinishEditing: PropTypes.func,
};

Comment.defaultProps = {
  isSelected: false,
  isGhost: false,
  isDragged: false,
  onMouseDown: noop,
  onMouseUp: noop,
  onResizeHandleMouseDown: noop,
  onFinishEditing: noop,
};

export default Comment;
