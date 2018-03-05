import React from 'react';
import PropTypes from 'prop-types';
import Collapsible from 'react-collapsible';

import { noop } from '../../utils/ramda';

const PatchGroup = ({ name, children, type, onClose }) => (
  <Collapsible
    classParentString="PatchGroup"
    data-id={name} // TODO: leave only a single data-id.
    trigger={
      <span className="patch-group-trigger" data-id={name}>
        {name}
      </span>
    }
    triggerClassName={type}
    triggerOpenedClassName={type}
    transitionTime={100}
    onClose={onClose}
  >
    {children}
  </Collapsible>
);

PatchGroup.displayName = 'PatchGroup';

PatchGroup.propTypes = {
  name: PropTypes.string.isRequired,
  children: PropTypes.node,
  type: PropTypes.oneOf(['library', 'my']),
  onClose: PropTypes.func,
};

PatchGroup.defaultProps = {
  onClose: noop,
};

export default PatchGroup;
