import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import { LAYER, EDITOR_MODE } from '../../../editor/constants';

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

  isLinking(source) {
    const props = source || this.props;
    return (props.mode === EDITOR_MODE.LINKING && props.ghostLink);
  }

  isDraggingGhost(source) {
    return this.isLinking(source);
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
  mode: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
  ghostLink: PropTypes.any,
};

export default GhostLayer;
