import R from 'ramda';
import React from 'react';

import SVGLayer from '../components/SVGLayer';
import Node from '../components/Node';
import Link from '../components/Link';
import { GHOSTS as LAYER_NAME } from '../constants/layers';

class GhostLayer extends React.Component {
  constructor(props) {
    super(props);
    this.displayName = 'GhostLayer';
    this.state = {
      active: false,
    };
  }

  componentWillReceiveProps(nextProps) {
    const val = this.isDraggingGhost(nextProps);
    this.setState(
      R.assoc('active', val, this.state)
    );
  }

  shouldComponentUpdate(nextProps) {
    if (this.isDraggingGhost(nextProps) || this.state.active) {
      return true;
    }

    return false;
  }

  getNode() {
    if (!this.isCreatingNode() || !this.props.ghostNode) { return null; }

    const updatePins = R.pipe(
      R.values,
      R.map(pin => R.assoc('position', {
        x: pin.position.x + this.props.mousePosition.x,
        y: pin.position.y + this.props.mousePosition.y,
      }, pin)),
      R.reduce((p, cur) => R.assoc(cur.id, cur, p), {})
    );

    const node = R.merge(
      this.props.ghostNode,
      {
        position: this.props.mousePosition,
        isGhost: true,
        pins: updatePins(this.props.ghostNode.pins),
      }
    );

    return (
      <Node
        key={node.id}
        id={node.id}
        label={node.label}
        position={node.position}
        pins={node.pins}
        isGhost={node.isGhost}
      />
    );
  }

  getLink() {
    if (!this.isLinking() || !this.props.ghostLink) { return null; }

    const link = R.merge(
      this.props.ghostLink,
      {
        to: this.props.mousePosition,
        isGhost: true,
      }
    );

    return (
      <Link
        key={link.id}
        id={link.id}
        from={link.from}
        to={link.to}
        isGhost={link.isGhost}
      />
    );
  }

  isCreatingNode(source) {
    const props = source || this.props;
    return (props.mode.isCreatingNode && props.ghostNode);
  }

  isLinking(source) {
    const props = source || this.props;
    return (props.mode.isLinking && props.ghostLink);
  }

  isDraggingGhost(source) {
    return (this.isLinking(source) || this.isCreatingNode(source));
  }

  render() {
    const ghostNode = this.getNode();
    const ghostLink = this.getLink();

    return (
      <SVGLayer
        name={LAYER_NAME}
        className="GhostsLayer"
      >
        {ghostNode}
        {ghostLink}
      </SVGLayer>
    );
  }
}

GhostLayer.propTypes = {
  mousePosition: React.PropTypes.objectOf(React.PropTypes.number),
  mode: React.PropTypes.object,
  ghostNode: React.PropTypes.any,
  ghostLink: React.PropTypes.any,
};

export default GhostLayer;
