import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import * as XP from 'xod-project';

import Pin from './Pin';
import PinLabel from './PinLabel';
import { noop } from '../../utils/ramda';
import { isPinSelected } from '../../editor/utils';

import RegularNodeBody from './nodeParts/RegularNodeBody';
import WatchNodeBody from './nodeParts/WatchNodeBody';
import TerminalNodeBody from './nodeParts/TerminalNodeBody';

class Node extends React.Component {
  constructor(props) {
    super(props);
    this.id = this.props.id;
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  shouldComponentUpdate(newProps) {
    return !R.equals(newProps, this.props);
  }

  onMouseDown(event) {
    this.props.onMouseDown(event, this.id);
  }

  onMouseUp(event) {
    this.props.onMouseUp(event, this.id);
  }

  renderBody() {
    const { type } = this.props;

    return R.cond([
      [XP.isTerminalPatchPath, () => <TerminalNodeBody {...this.props} />],
      [XP.isWatchPatchPath, () => <WatchNodeBody {...this.props} />],
      [R.T, () => <RegularNodeBody {...this.props} />],
    ])(type);
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
          onMouseUp={this.onMouseUp}
          title={nodeLabel} // this is for func-tests
        >
          {this.renderBody()}
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
  onMouseUp: PropTypes.func,
};

Node.defaultProps = {
  isSelected: false,
  isGhost: false,
  isDragged: false,
  noEvents: false,
  onMouseDown: noop,
  onMouseUp: noop,
  pinLinkabilityValidator: R.F,
};

export default Node;
