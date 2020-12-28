import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
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
    this.onFollowLogClicked = this.onFollowLogClicked.bind(this);
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

  componentDidUpdate(prevProps) {
    // To trigger scroll to the bottom and follow log
    // after resizing the parents component we're checking for
    // change of `doNotSkipLines` property from `true` to `false`
    const skipLinesJustTurnedOn =
      prevProps.doNotSkipLines && !this.props.doNotSkipLines;
    if (
      this.props.log.length === 0 ||
      (skipLinesJustTurnedOn && !this.props.isSkippingNewSerialLogLines)
    ) {
      this.onFollowLog(false);
    }
  }

  onFollowLog(addSkipMessage = true) {
    this.scrollToBottom();
    this.props.stopSkippingNewLogLines(addSkipMessage);
  }

  onFollowLogClicked(_event) {
    this.onFollowLog(true);
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
      doNotSkipLines,
      isSkippingNewSerialLogLines,
      numberOfSkippedSerialLogLines,
      isSkipOnScrollEnabled,
      startSkippingNewLogLines,
      compact,
    } = this.props;

    return (
      <Autoscroll
        className={cn('log', { compact })}
        ref={el => (this.autoscrollRef = el)}
        onScrolledFromBottom={
          isSkipOnScrollEnabled && !doNotSkipLines
            ? startSkippingNewLogLines
            : noop
        }
      >
        {log}
        {R.isEmpty(error) ? null : <div className="error">{error}</div>}
        {isSkipOnScrollEnabled && isSkippingNewSerialLogLines ? (
          <div className="skipped">
            <button
              className="Button Button--small"
              onClick={this.onFollowLogClicked}
            >
              Follow log ({numberOfSkippedSerialLogLines} new lines skipped)
            </button>
          </div>
        ) : null}
      </Autoscroll>
    );
  }
}

Log.defaultProps = {
  doNotSkipLines: false,
};

Log.propTypes = {
  doNotSkipLines: PropTypes.bool.isRequired,
  log: PropTypes.string.isRequired,
  error: PropTypes.string.isRequired,
  isSkippingNewSerialLogLines: PropTypes.bool.isRequired,
  compact: PropTypes.bool.isRequired,
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
