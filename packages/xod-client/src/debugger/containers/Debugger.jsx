import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ContextMenuTrigger, ContextMenu, MenuItem } from 'react-contextmenu';
import { Icon } from 'react-fa';
import { foldMaybe } from 'xod-func-tools';

import { getUploadProgress, isDebuggerVisible } from '../selectors';
import { UPLOAD_MSG_TYPE } from '../constants';
import * as DA from '../actions';
import Log from './Log';

const contextMenuAttrs = {
  className: 'contextmenu filter-button',
};

const DEPLOYMENT_PANEL_FILTER_CONTEXT_MENU_ID =
  'DEPLOYMENT_PANEL_FILTER_CONTEXT_MENU_ID';

const checkmark = active => (active ? <span className="state">✔</span> : null);

class Debugger extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      messageTypeFilter: {
        [UPLOAD_MSG_TYPE.FLASHER]: true,
        [UPLOAD_MSG_TYPE.XOD]: false,
      },
    };

    this.toggleDebugMessages = this.toggleMessageType.bind(
      this,
      UPLOAD_MSG_TYPE.XOD
    );
    this.toggleUploadMessages = this.toggleMessageType.bind(
      this,
      UPLOAD_MSG_TYPE.FLASHER
    );
  }

  toggleMessageType(type) {
    this.setState(R.over(R.lensPath(['messageTypeFilter', type]), R.not));
  }

  renderControlsForExpandedState() {
    const { isExpanded, actions } = this.props;

    if (!isExpanded) return null;

    const { messageTypeFilter } = this.state;

    return (
      <React.Fragment>
        <button
          className="clear-log-button"
          onClick={actions.clearLog}
          title="Clear Log"
        />
        <ContextMenuTrigger
          id={DEPLOYMENT_PANEL_FILTER_CONTEXT_MENU_ID}
          key="contextMenuTrigger"
          renderTag="button"
          attributes={contextMenuAttrs}
          holdToDisplay={0}
        >
          <span />
        </ContextMenuTrigger>
        <ContextMenu id={DEPLOYMENT_PANEL_FILTER_CONTEXT_MENU_ID}>
          <MenuItem onClick={this.toggleUploadMessages}>
            {checkmark(messageTypeFilter[UPLOAD_MSG_TYPE.FLASHER])}
            Upload Log
          </MenuItem>
          <MenuItem onClick={this.toggleDebugMessages}>
            {checkmark(messageTypeFilter[UPLOAD_MSG_TYPE.XOD])}
            Watched Values
          </MenuItem>
        </ContextMenu>
      </React.Fragment>
    );
  }

  render() {
    const {
      maybeUploadProgress,
      actions,
      onUploadClick,
      onUploadAndDebugClick,
      isExpanded,
    } = this.props;

    const uploadProgress = foldMaybe(
      null,
      progress => (
        <div className="progress-trail">
          <div
            className="progress-line"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={progress}
          />
        </div>
      ),
      maybeUploadProgress
    );

    const { messageTypeFilter } = this.state;
    const rejectedMessageTypes = R.compose(R.keys, R.filter(R.equals(false)))(
      messageTypeFilter
    );

    return (
      <div className={cn('Debugger', { isCollapsed: !isExpanded })}>
        <div className="titlebar">
          <div // eslint-disable-line jsx-a11y/no-static-element-interactions
            role="button"
            className="expander"
            onClick={actions.toggleDebugger}
          >
            <span className="title">Deployment</span>

            <div className="progress">{uploadProgress}</div>
          </div>

          {this.renderControlsForExpandedState()}

          <button
            className="quick-upload-button"
            onClick={onUploadClick}
            title="Upload to Arduino"
          />
          <button
            className="debug-button"
            onClick={onUploadAndDebugClick}
            title="Upload and Debug"
          />
          <Icon
            Component="button"
            className="close-button"
            name={isExpanded ? 'chevron-down' : 'chevron-up'}
            onClick={actions.toggleDebugger}
          />
        </div>

        {isExpanded ? (
          <div className="container">
            <Log rejectedMessageTypes={rejectedMessageTypes} />
          </div>
        ) : null}
      </div>
    );
  }
}

Debugger.propTypes = {
  maybeUploadProgress: PropTypes.object.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  actions: PropTypes.objectOf(PropTypes.func),
  onUploadClick: PropTypes.func.isRequired,
  onUploadAndDebugClick: PropTypes.func.isRequired,
};

const mapStateToProps = R.applySpec({
  maybeUploadProgress: getUploadProgress,
  isExpanded: isDebuggerVisible,
});
const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(
    {
      toggleDebugger: DA.toggleDebugger,
      clearLog: DA.clearDebuggerLog,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(Debugger);
