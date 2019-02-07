import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import * as XP from 'xod-project';
import { noop } from 'xod-func-tools';

import WatchNodeBody from './WatchNodeBody';
import { getConstantValue } from './ConstantNodeBody';

const TweakNodeBody = props => (
  <WatchNodeBody
    {...props}
    label={props.label || getConstantValue(props) || XP.getBaseName(props.type)}
  />
);

TweakNodeBody.defaultProps = {
  onVariadicHandleDown: noop,
};

TweakNodeBody.propTypes = R.merge(WatchNodeBody.propTypes, {
  pins: PropTypes.any,
});

export default TweakNodeBody;
