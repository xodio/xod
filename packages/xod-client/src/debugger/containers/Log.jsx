import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { noop } from 'xod-func-tools';

import * as selectors from '../selectors';
import * as actions from '../actions';
import { LOG_TAB_TYPE } from '../constants';

import Autoscroll from '../../utils/components/Autoscroll';

class Log extends React.PureComponent {
  constructor(props) {
    super(props);

    this.autoscrollRef = null;

    this.onFollowLog = this.onFollowLog.bind(this);
    this.scrollToBottom = this.scrollToBottom.bind(this);
  }

  componentDidMount() {
    // Postpone scrolling to the next tick
    // so content could be rendered and then
    // it will scroll to the right position
    setTimeout(() => {
      this.scrollToBottom();
    }, 0);
  }

  onFollowLog() {
    this.scrollToBottom();
    this.props.stopSkippingNewLogLines();
  }

  scrollToBottom() {
    if (this.autoscrollRef) {
      this.autoscrollRef.scrollDown();
    }
  }

  render() {
    const {
      log,
      error,
      isSkippingNewSerialLogLines,
      numberOfSkippedSerialLogLines,
      isSkipOnScrollEnabled,
      startSkippingNewLogLines,
    } = this.props;

    return (
      <Autoscroll
        className="log"
        ref={el => (this.autoscrollRef = el)}
        onScrolledFromBottom={
          isSkipOnScrollEnabled ? startSkippingNewLogLines : noop
        }
      >
        {log}
        {R.isEmpty(error) ? null : <div className="error">{error}</div>}
        {isSkipOnScrollEnabled && isSkippingNewSerialLogLines ? (
          <div className="skipped">
            <button className="Button Button--small" onClick={this.onFollowLog}>
              Follow log ({numberOfSkippedSerialLogLines} new lines skipped)
            </button>
          </div>
        ) : null}
      </Autoscroll>
    );
  }
}

Log.propTypes = {
  log: PropTypes.string.isRequired,
  error: PropTypes.string.isRequired,
  isSkippingNewSerialLogLines: PropTypes.bool.isRequired,
  numberOfSkippedSerialLogLines: PropTypes.number.isRequired,
  isSkipOnScrollEnabled: PropTypes.bool.isRequired,
  startSkippingNewLogLines: PropTypes.func.isRequired,
  stopSkippingNewLogLines: PropTypes.func.isRequired,
};

const mapStateToProps = R.applySpec({
  log: selectors.getLogForCurrentTab,
  error: selectors.getErrorForCurrentTab,
  isSkipOnScrollEnabled: R.pipe(
    selectors.getCurrentDebuggerTab,
    R.equals(LOG_TAB_TYPE.DEBUGGER)
  ),
  isSkippingNewSerialLogLines: selectors.isSkippingNewSerialLogLines,
  numberOfSkippedSerialLogLines: selectors.getNumberOfSkippedSerialLogLines,
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      startSkippingNewLogLines: actions.startSkippingNewLogLines,
      stopSkippingNewLogLines: actions.stopSkippingNewLogLines,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(Log);
