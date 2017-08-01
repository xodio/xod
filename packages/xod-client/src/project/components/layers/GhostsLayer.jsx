import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import { LAYER } from '../../../editor/constants';

import SVGLayer from './SVGLayer';
import XODLink from '../Link';

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
  mousePosition: PropTypes.objectOf(PropTypes.number),
  mode: PropTypes.object, // eslint-disable-line
  ghostLink: PropTypes.any,
};

export default GhostLayer;
