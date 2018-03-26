import React from 'react';
import PropTypes from 'prop-types';

const NodeSpecializationWidget = props => {
  const onChange = event => props.onChange(props.nodeId, event.target.value);

  return (
    <div className="Widget NodeSpecializationWidget">
      <select
        className="inspectorSelectInput"
        value={props.value}
        onChange={onChange}
      >
        {props.specializations.map(spec => (
          <option key={spec.value} value={spec.value}>
            {spec.label}
          </option>
        ))}
      </select>
    </div>
  );
};

/* eslint-disable react/no-unused-prop-types */
NodeSpecializationWidget.propTypes = {
  nodeId: PropTypes.string.isRequired,
  specializations: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
    })
  ),
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};
/* eslint-enable react/no-unused-prop-types */

export default NodeSpecializationWidget;
