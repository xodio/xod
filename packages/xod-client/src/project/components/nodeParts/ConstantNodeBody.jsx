import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import * as XP from 'xod-project';
import { noop } from 'xod-func-tools';

import RegularNodeBody from './RegularNodeBody';

export const getConstantValue = ({ pins }) =>
  R.compose(R.prop('value'), R.head, R.values)(pins);

const ConstantNodeBody = props => (
  <RegularNodeBody
    {...props}
    label={props.label || getConstantValue(props) || XP.getBaseName(props.type)}
    isResizable
  />
);

ConstantNodeBody.defaultProps = {
  onVariadicHandleDown: noop,
};

ConstantNodeBody.propTypes = R.merge(RegularNodeBody.propTypes, {
  pins: PropTypes.any,
});

export default ConstantNodeBody;
