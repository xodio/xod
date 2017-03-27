import R from 'ramda';
import React from 'react';
import { LAYER } from 'xod-core';

import SVGLayer from './SVGLayer';
import XODLink from './Link';

class GhostLayer extends React.Component {
  constructor(props) {
    super(props);
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

  getLink() {
    const { ghostLink } = this.props;

    if (!this.isLinking() || !ghostLink) { return null; }

    return (
      <XODLink
        key={ghostLink.id}
        id={ghostLink.id}
        from={ghostLink.from}
        type={ghostLink.type}
        to={this.props.mousePosition}
        isGhost
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
    const ghostLink = this.getLink();

    return (
      <SVGLayer
        name={LAYER.GHOSTS}
        className="GhostsLayer"
      >
        {ghostLink}
      </SVGLayer>
    );
  }
}

GhostLayer.displayName = 'GhostLayer';

GhostLayer.propTypes = {
  mousePosition: React.PropTypes.objectOf(React.PropTypes.number),
  mode: React.PropTypes.object, // eslint-disable-line
  ghostLink: React.PropTypes.any,
};

export default GhostLayer;
