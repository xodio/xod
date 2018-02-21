import React from 'react';
import { storiesOf } from '@storybook/react';

import '../src/core/styles/main.scss';
import HOC from '../src/tooltip/components/TooltipHOC';
import Tooltip from '../src/tooltip/components/Tooltip';

const randomColor = () => `#${Math.floor(Math.random() * 16777215).toString(16)}`;
const stylizeDiv = (top, left) => ({
  background: randomColor(),
  position: 'absolute',
  padding: '5px',
  top,
  left,
});

storiesOf('Tooltip', module)
  .add('basic', () => (
    <div>
      <HOC
        content={(<div>Hello, world</div>)}
        render={(onMouseOver, onMouseMove, onMouseLeave) =>
          <div
            onMouseOver={onMouseOver}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={stylizeDiv(100, 100)}
          >
            Hover me!
          </div>
        }
      />
      <HOC
        content={(<div>
          We can show any content here:<br />
          <img src="http://placehold.it/100x30" alt="" /><br />
          <p style={{ color: 'red' }}>
            Even colorful paragraphs!
          </p>
          <p style={{ color: 'cyan' }}>
            So there is no restrictions for your imagination!
          </p>
        </div>)}
        render={(onMouseOver, onMouseMove, onMouseLeave) =>
          <div
            onMouseOver={onMouseOver}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={stylizeDiv(200, 300)}
          >
            Hover me, I have a RICH content!
          </div>
        }
      />
      <HOC
        content={(<div>You show hint for one that above...</div>)}
        render={(onMouseOver, onMouseMove, onMouseLeave) =>
          <div
            onMouseOver={onMouseOver}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={stylizeDiv(400, 350)}
          >
            Try me too!
          </div>
        }
      />
      <HOC
        content={(<div>And now for one that below...</div>)}
        render={(onMouseOver, onMouseMove, onMouseLeave) =>
          <div
            onMouseOver={onMouseOver}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            style={stylizeDiv(424, 350)}
          >
            And me!
          </div>
        }
      />
      <Tooltip />
    </div>
  ));
