import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import * as XP from 'xod-project';

import Pin from './Pin';
import PinLabel from './PinLabel';
import { noop } from '../../utils/ramda';
import { isPinSelected } from '../../editor/utils';

import { NODE_CORNER_RADIUS } from '../nodeLayout';

const NodeLabel = ({ text, ...props }) => (
  <foreignObject {...props}>
    <div className="nodeLabelContainer" xmlns="http://www.w3.org/1999/xhtml">
      <span className="nodeLabel">{text}</span>
    </div>
  </foreignObject>
);

NodeLabel.propTypes = {
  text: PropTypes.string.isRequired,
};

const NODE_BODY_RECT_PROPS = {
  rx: NODE_CORNER_RADIUS,
  ry: NODE_CORNER_RADIUS,
  // size is set in root svg, let's occupy it all
  width: '100%',
  height: '100%',
};

const renderRegularNodeBody = (node, nodeLabel) => (
  <g>
    <rect
      className="body"
      {...NODE_BODY_RECT_PROPS}
    />
    <NodeLabel
      text={nodeLabel}
      {...node.size}
    />
    <rect
      className="outline"
      {...NODE_BODY_RECT_PROPS}
    />
  </g>
);

const renderTerminalNodeBody = (node) => {
  const isInput = XP.isInputTerminalPath(node.type);
  const radius = node.size.width / 2;
  const yOffset = isInput ? (node.size.height - node.size.width) : 0;
  const circleProps = {
    cx: radius,
    cy: radius + yOffset,
    r: radius,
  };

  return (
    <g>
      <circle
        className="body"
        {...circleProps}
      />
      <NodeLabel
        text={node.label}
        width={node.size.width}
        height={node.size.width}
        y={yOffset + (isInput ? -1 : 1)}
      />
      <circle
        className={classNames('outline', XP.getTerminalDataType(node.type))}
        {...circleProps}
      />
    </g>
  );
};

class Node extends React.Component {
  constructor(props) {
    super(props);
    this.id = this.props.id;
    this.onMouseDown = this.onMouseDown.bind(this);
  }

  shouldComponentUpdate(newProps) {
    return !R.equals(newProps, this.props);
  }

  onMouseDown(event) {
    this.props.onMouseDown(event, this.id);
  }

  render() {
    const {
      label,
      linkingPin,
      pins,
      position,
      size,
      type,
    } = this.props;

    const pinsArr = R.values(pins);

    const cls = classNames('Node', {
      'is-selected': this.props.isSelected,
      'is-dragged': this.props.isDragged,
      'is-ghost': this.props.isGhost,
    });


    const svgStyle = {
      overflow: 'visible',
      opacity: this.props.hidden ? 0 : 1, // setting visibility is breaking masks
      pointerEvents: this.props.noEvents ? 'none' : 'auto',
    };

    const nodeLabel = label || XP.getBaseName(type);

    const isTerminalNode = XP.isTerminalPatchPath(type);

    return (
      <svg
        key={this.id}
        style={svgStyle}
        {...position}
        {...size}
        viewBox={`0 0 ${size.width} ${size.height}`}
      >
        <g
          className={cls}
          onMouseDown={this.onMouseDown}
          title={nodeLabel} // this is for func-tests
        >
          {
            isTerminalNode
              ? renderTerminalNodeBody(this.props)
              : renderRegularNodeBody(this.props, nodeLabel)
          }
          {!this.props.isDragged ? <title>{nodeLabel}</title> : null}
        </g>
        <g className="pins">
          {pinsArr.map(pin =>
            <g key={pin.key}>
              {isTerminalNode ? null : (
                <PinLabel
                  {...pin}
                  keyName={pin.key}
                  key={`pinlabel_${pin.key}`}
                />
              )}
              <Pin
                {...pin}
                isSelected={isPinSelected(linkingPin, pin)}
                isAcceptingLinks={this.props.pinLinkabilityValidator(pin)}
                keyName={pin.key}
                key={`pin_${pin.key}`}
              />
            </g>
          )}
        </g>
      </svg>
    );
  }
}

Node.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  pins: PropTypes.any.isRequired,
  size: PropTypes.any.isRequired,
  position: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  isGhost: PropTypes.bool,
  isDragged: PropTypes.bool,
  hidden: PropTypes.bool,
  noEvents: PropTypes.bool,
  linkingPin: PropTypes.object,
  pinLinkabilityValidator: PropTypes.func,
  onMouseDown: PropTypes.func,
};

Node.defaultProps = {
  isSelected: false,
  isGhost: false,
  isDragged: false,
  noEvents: false,
  onMouseDown: noop,
  pinLinkabilityValidator: R.F,
};

export default Node;
