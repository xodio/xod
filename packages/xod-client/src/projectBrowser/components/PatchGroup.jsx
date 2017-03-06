import React from 'react';
import Collapsible from 'react-collapsible';
import 'font-awesome/scss/font-awesome.scss';

const PatchGroup = ({ name, children, type }) => (
  <Collapsible
    classParentString="PatchGroup"
    trigger={name}
    triggerClassName={type}
    triggerOpenedClassName={type}
  >
    { children }
  </Collapsible>
);

PatchGroup.displayName = 'PatchGroup';

PatchGroup.propTypes = {
  name: React.PropTypes.string.isRequired,
  children: React.PropTypes.node,
  type: React.PropTypes.oneOf(['library', 'my']),
};

export default PatchGroup;
