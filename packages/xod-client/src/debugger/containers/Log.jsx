import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Infinite from 'react-infinite';

import { getLog } from '../selectors';
import SystemMessage from '../components/SystemMessage';
import ErrorMessage from '../components/ErrorMessage';
import LogMessage from '../components/LogMessage';
import XodMessage from '../components/XodMessage';

const hasType = R.curry((type, messageData) =>
  R.propEq('type', type, messageData)
);

const renderLogMessage = (messageData, idx) =>
  R.compose(
    Renderer => <Renderer key={idx} data={messageData} />,
    R.cond([
      [hasType('system'), R.always(SystemMessage)],
      [hasType('error'), R.always(ErrorMessage)],
      [hasType('xod'), R.always(XodMessage)],
      [R.T, R.always(LogMessage)],
    ])
  )(messageData);

const Log = ({ log }) => (
  <Infinite
    className="log"
    elementHeight={19}
    containerHeight={180}
    displayBottomUpwards
  >
    {log.map(renderLogMessage)}
  </Infinite>
);

Log.propTypes = {
  log: PropTypes.arrayOf(PropTypes.object),
};

const mapStateToProps = R.applySpec({
  log: getLog,
});

export default connect(mapStateToProps, {})(Log);
