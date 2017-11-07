import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Icon } from 'react-fa';
import classNames from 'classnames';

import { isDebugSession } from '../selectors';
import * as DA from '../actions';
import Log from './Log';

const Debugger = ({ active, actions }) => {
  const cls = classNames('Debugger', {
    'is-active': active,
  });

  const statusIcon = active ? 'play' : 'stop';

  return (
    <div className={cls}>
      <div className="caption">
        <Icon
          key="status"
          name={statusIcon}
          title="Debugs session is running"
          className="status"
        />
        <span className="title">Debugger</span>
        <button className="close-button" onClick={actions.hideDebugger}>
          &times;
        </button>
      </div>
      <button className="clear-log-button" onClick={actions.clearLog}>
        Clear log
      </button>
      <div className="container">
        <Log />
      </div>
    </div>
  );
};

Debugger.propTypes = {
  active: PropTypes.bool,
  actions: PropTypes.objectOf(PropTypes.func),
};

const mapStateToProps = R.applySpec({
  active: isDebugSession,
});
const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(
    {
      hideDebugger: DA.hideDebugger,
      clearLog: DA.clearDebuggerLog,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(Debugger);
