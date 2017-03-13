import React from 'react';
import Collapsible from 'react-collapsible';
import 'font-awesome/scss/font-awesome.scss';

import { noop } from '../../utils/ramda';

const PatchGroup = ({ name, children, type, onClose }) => (
  <Collapsible
    classParentString="PatchGroup"
    trigger={name}
    triggerClassName={type}
    triggerOpenedClassName={type}
    transitionTime={100}
    onClose={onClose}
  >
    { children }
  </Collapsible>
);

PatchGroup.displayName = 'PatchGroup';

PatchGroup.propTypes = {
  name: React.PropTypes.string.isRequired,
  children: React.PropTypes.node,
  type: React.PropTypes.oneOf(['library', 'my']),
  onClose: React.PropTypes.func,
};

PatchGroup.defaultProps = {
  onClose: noop,
};

export default PatchGroup;
