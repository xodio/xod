import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';

import { EDITOR_MODE } from '../../../editor/constants';

import XODLink from '../Link';

class GhostLayer extends React.Component {
  shouldComponentUpdate(nextProps) {
    if (!this.isLinking(nextProps) && this.props.mode === nextProps.mode) {
      return false;
    }

    return !R.equals(nextProps, this.props);
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

  render() {
    const ghostLink = this.getLink();

    return (
      <g className="GhostsLayer">
        {ghostLink}
      </g>
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
