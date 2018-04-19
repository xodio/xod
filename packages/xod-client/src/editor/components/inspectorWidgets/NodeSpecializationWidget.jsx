import React from 'react';
import PropTypes from 'prop-types';
import cls from 'classnames';

const NodeSpecializationWidget = props => {
  const onChange = event => props.onChange(props.nodeId, event.target.value);

  const hasSpecializations =
    props.specializations && props.specializations.length > 0;

  const specializations = hasSpecializations ? (
    props.specializations.map(spec => (
      <option key={spec} value={spec}>
        {spec}
      </option>
    ))
  ) : (
    <option key={props.value} value={props.value}>
      {props.value}
    </option>
  );

  const classNames = cls('Widget', 'NodeSpecializationWidget', {
    'no-specializations': !hasSpecializations,
  });

  return (
    <div className={classNames}>
      <span className="nodeType">{props.value}</span>
      <select
        className="inspectorSelectInput"
        value={props.value}
        onChange={onChange}
        title={props.value}
        disabled={!hasSpecializations}
      >
        {specializations}
      </select>
    </div>
  );
};

/* eslint-disable react/no-unused-prop-types */
NodeSpecializationWidget.propTypes = {
  nodeId: PropTypes.string.isRequired,
  specializations: PropTypes.arrayOf(PropTypes.string),
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};
/* eslint-enable react/no-unused-prop-types */

export default NodeSpecializationWidget;
