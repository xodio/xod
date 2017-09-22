import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Icon } from 'react-fa';
import classNames from 'classnames';
import CustomScroll from 'react-custom-scroll';

import { isDebugSession, getLog } from '../selectors';
import * as DA from '../actions';

import SystemMessage from '../components/SystemMessage';
import ErrorMessage from '../components/ErrorMessage';
import LogMessage from '../components/LogMessage';
import XodMessage from '../components/XodMessage';

const renderLogMessage = (messageData, idx) => {
  let Renderer = LogMessage;

  switch (messageData.type) {
    case 'system':
      Renderer = SystemMessage;
      break;
    case 'error':
      Renderer = ErrorMessage;
      break;
    case 'xod':
      Renderer = XodMessage;
      break;
    default:
    case 'log':
      Renderer = LogMessage;
      break;
  }

  return <Renderer key={idx} data={messageData} />;
};

const Debugger = ({ log, active, actions }) => {
  const cls = classNames('Debugger', {
    'is-active': active,
  });

  const statusIcon = (active) ? 'play' : 'stop';

  return (
    <div className={cls}>
      <div className="caption">
        <Icon
          key="status"
          name={statusIcon}
          title="Debugs session is running"
          className="status"
        />
        <span className="title">
          Debugger
        </span>
        <button
          className="close-button"
          onClick={actions.hideDebugger}
        >
          &times;
        </button>
      </div>
      <button
        className="clear-log-button"
        onClick={actions.clearLog}
      >
        Clear log
      </button>
      <div className="container">
        <CustomScroll keepAtBottom>
          <div className="log">
            {log.map(renderLogMessage)}
          </div>
        </CustomScroll>
      </div>
    </div>
  );
};

Debugger.propTypes = {
  log: PropTypes.arrayOf(PropTypes.object),
  active: PropTypes.bool,
  actions: PropTypes.objectOf(PropTypes.func),
};

const mapStateToProps = R.applySpec({
  active: isDebugSession,
  log: getLog,
});
const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    hideDebugger: DA.hideDebugger,
    clearLog: DA.clearDebuggerLog,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Debugger);
