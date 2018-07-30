import * as R from 'ramda';
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
import ConstantNodeBody from './nodeParts/ConstantNodeBody';
import BusNodeBody from './nodeParts/BusNodeBody';

import TooltipHOC from '../../tooltip/components/TooltipHOC';

import nodeHoverContextType from '../../editor/nodeHoverContextType';
import formatErrorMessage from '../../core/formatErrorMessage';

const isBusNodeType = R.either(
  R.equals(XP.TO_BUS_PATH),
  R.equals(XP.FROM_BUS_PATH)
);

const renderTooltipContent = (nodeType, nodeLabel, isDeprecated, errText) =>
  R.compose(
    R.when(
      () => isDeprecated,
      R.concat([
        <div key="deprecated" className="Tooltip--deprecated">
          Deprecated
        </div>,
      ])
    ),
    R.when(
      () => !!errText,
      R.append(
        <div key="error" className="Tooltip--error">
          {errText}
        </div>
      )
    )
  )([
    <div key="nodeLabel" className="Tooltip--nodeLabel">
      {nodeLabel}
    </div>,
    <div key="nodeType" className="Tooltip--nodeType">
      {nodeType}
    </div>,
  ]);

class Node extends React.Component {
  constructor(props) {
    super(props);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onDoubleClick = this.onDoubleClick.bind(this);
  }

  shouldComponentUpdate(newProps) {
    return !R.eqBy(
      R.omit(['onMouseDown', 'onMouseUp', 'onDoubleClick']),
      newProps,
      this.props
    );
  }

  componentWillUnmount() {
    this.onMouseLeave();
  }

  onMouseDown(event) {
    this.props.onMouseDown(event, this.props.id);
  }

  onMouseUp(event) {
    this.props.onMouseUp(event, this.props.id);
  }

  onDoubleClick() {
    this.props.onDoubleClick(this.props.id, this.props.type);
  }

  onMouseOver(...args) {
    return R.pathOr(noop, ['context', 'nodeHover', 'onMouseOver'], this)(
      ...args
    );
  }

  onMouseLeave(...args) {
    return R.pathOr(noop, ['context', 'nodeHover', 'onMouseLeave'], this)(
      ...args
    );
  }

  getHoveredNodeId() {
    return R.pathOr(null, ['context', 'nodeHover', 'nodeId'], this);
  }

  isNodeHovered() {
    return (
      this.getHoveredNodeId() === this.props.id && !this.props.noNodeHovering
    );
  }

  renderBody() {
    const { type } = this.props;

    return R.cond([
      [XP.isTerminalPatchPath, () => <TerminalNodeBody {...this.props} />],
      [XP.isWatchPatchPath, () => <WatchNodeBody {...this.props} />],
      [XP.isConstantNodeType, () => <ConstantNodeBody {...this.props} />],
      [isBusNodeType, () => <BusNodeBody {...this.props} />],
      [R.T, () => <RegularNodeBody {...this.props} />],
    ])(type);
  }

  render() {
    const {
      id,
      label,
      linkingPin,
      pins,
      position,
      size,
      type,
      isDragged,
      isDeprecated,
    } = this.props;

    const pinsArr = R.values(pins);

    const cls = classNames('Node', {
      'is-selected': this.props.isSelected,
      'is-dragged': isDragged,
      'is-ghost': this.props.isGhost,
      'is-variadic': this.props.isVariadic,
      'is-changing-arity': this.props.isChangingArity,
      'is-errored': this.props.errors.length > 0,
      'is-hovered': this.isNodeHovered(),
      'is-deprecated': this.props.isDeprecated,
    });

    const pinsCls = classNames('pins', {
      'is-ghost': this.props.isGhost,
    });

    const svgStyle = {
      overflow: 'visible',
      opacity: this.props.hidden ? 0 : 1, // setting visibility is breaking masks
      pointerEvents: this.props.noEvents ? 'none' : 'auto',
    };

    const nodeLabel = label || XP.getBaseName(type);

    const isTerminalNode = XP.isTerminalPatchPath(type);

    const errMessage =
      this.props.errors.length > 0
        ? R.compose(
            R.join(';\n'),
            R.map(R.pipe(formatErrorMessage, R.prop('note')))
          )(this.props.errors)
        : null;

    return (
      <TooltipHOC
        content={
          isDragged
            ? null
            : renderTooltipContent(type, nodeLabel, isDeprecated, errMessage)
        }
        render={(onMouseOver, onMouseMove, onMouseLeave) => (
          <svg
            key={id}
            style={svgStyle}
            {...position}
            {...size}
            viewBox={`0 0 ${size.width} ${size.height}`}
            onMouseOver={(...args) => {
              onMouseOver(...args);
              this.onMouseOver(id);
            }}
            onMouseMove={onMouseMove}
            onMouseLeave={(...args) => {
              onMouseLeave(...args);
              this.onMouseLeave();
            }}
          >
            <g
              className={cls}
              onMouseDown={this.onMouseDown}
              onMouseUp={this.onMouseUp}
              onDoubleClick={this.onDoubleClick}
              id={id}
              data-label={nodeLabel} // for func tests
            >
              {this.renderBody()}
            </g>
            <g className={pinsCls} id={`nodePins_${id}`}>
              {pinsArr.map(pin => (
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
              ))}
            </g>
          </svg>
        )}
      />
    );
  }
}

Node.contextTypes = {
  nodeHover: nodeHoverContextType,
};

Node.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  pins: PropTypes.any.isRequired,
  size: PropTypes.any.isRequired,
  position: PropTypes.object.isRequired,
  errors: PropTypes.arrayOf(PropTypes.instanceOf(Error)),
  isDeprecated: PropTypes.bool,
  isSelected: PropTypes.bool,
  isGhost: PropTypes.bool,
  isDragged: PropTypes.bool,
  isVariadic: PropTypes.bool,
  isChangingArity: PropTypes.bool,
  hidden: PropTypes.bool,
  noEvents: PropTypes.bool,
  linkingPin: PropTypes.object,
  pinLinkabilityValidator: PropTypes.func,
  onMouseDown: PropTypes.func,
  onMouseUp: PropTypes.func,
  onDoubleClick: PropTypes.func,
  noNodeHovering: PropTypes.bool,
};

Node.defaultProps = {
  errors: [],
  isDeprecated: false,
  isSelected: false,
  isGhost: false,
  isDragged: false,
  isVariadic: false,
  isChangingArity: false,
  noEvents: false,
  onMouseDown: noop,
  onMouseUp: noop,
  onDoubleClick: noop,
  pinLinkabilityValidator: R.F,
  noNodeHovering: false,
};

export default Node;
