import React from 'react';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import '../src/core/styles/main.scss';
import Comment from '../src/project/components/Comment';

const baseProps = {
  id: 'my_comment_1',
  content: '',
  size: { width: 150, height: 100 },
  position: { x: 40, y: 30 },
  isSelected: false,
  isGhost: false,
  isDragged: false,
  hidden: false,
  onMouseDown: action('onMouseDown'),
  onResizeHandleMouseDown: action('onResizeHandleMouseDown'),
  onFinishEditing: action('onFinishEditing'),
};

const contentThatRequiresWordWrap = `
Here is a paragraph that requires word wrap.
Here is a paragraph that requires word wrap.
Here is a paragraph that requires word wrap.
Here is a paragraph that requires word wrap.
Here is a paragraph that requires word wrap.
Here is a paragraph that requires word wrap.
Here is a paragraph that requires word wrap.
Here is a paragraph that requires word wrap.
Here is a paragraph that requires word wrap.
`;

const markdownContent = `
# Heading
[link](http://example.com)

pagagraphs must
be wrapped

- a list
- of many
- things

http://this-should-be-autolinked.com

![cirquit](https://xod.io/docs/tutorial/02-deploy/circuit.fz.png)
`;

storiesOf('Comment', module)
  .addDecorator(story => (
    <svg width="500" height="500">
      <rect width="100%" height="100%" fill="lightgrey" />
      {story()}
    </svg>
  ))
  .add('default', () => (
    <Comment {...baseProps} content={contentThatRequiresWordWrap} />
  ))
  .add('markdown content', () => (
    <Comment
      {...baseProps}
      content={markdownContent}
      size={{ width: 350, height: 420 }}
    />
  ));
