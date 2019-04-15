import React from 'react';
import PropTypes from 'prop-types';
import Collapsible from 'react-collapsible';
import cls from 'classnames';

import { noop } from '../../utils/ramda';

const PatchGroup = ({ name, children, type, onClose, withErrors }) => (
  <Collapsible
    classParentString="PatchGroup"
    data-id={name} // TODO: leave only a single data-id.
    trigger={
      <span className="patch-group-trigger" data-id={name}>
        <span
          className={cls('icon', type, { 'with-errors': withErrors })}
          title={withErrors ? 'Library contains errors' : ''}
        />
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
  withErrors: PropTypes.boolean,
};

PatchGroup.defaultProps = {
  onClose: noop,
  withErrors: false,
};

export default PatchGroup;
