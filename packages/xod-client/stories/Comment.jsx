import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import '../src/core/styles/main.scss';
import Comment from '../src/project/components/Comment';

const baseProps = {
  id: 'my_comment_1',
  content: `
    Here is a paragraph that requires word wrap.
    Here is a paragraph that requires word wrap.
    Here is a paragraph that requires word wrap.
    Here is a paragraph that requires word wrap.
    Here is a paragraph that requires word wrap.
    Here is a paragraph that requires word wrap.
    Here is a paragraph that requires word wrap.
    Here is a paragraph that requires word wrap.
    Here is a paragraph that requires word wrap.
  `,
  size: { width: 150, height: 100 },
  position: { x: 100, y: 100 },
  isSelected: false,
  isGhost: false,
  isDragged: false,
  hidden: false,
  onMouseDown: action('onMouseDown'),
  onResizeHandleMouseDown: action('onResizeHandleMouseDown'),
  onFinishEditing: action('onFinishEditing'),
};

storiesOf('Comment', module)
  .addDecorator(story => (
    <svg width="500" height="500" fill="lightgrey">
      {story()}
    </svg>
  ))
  .add('default', () => (
    <Comment
      {...baseProps}
    />
  ));
