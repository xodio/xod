import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ContextMenuTrigger, ContextMenu, MenuItem } from 'react-contextmenu';
import { Icon } from 'react-fa';
import { foldMaybe } from 'xod-func-tools';

import { LOG_TAB_TYPE } from '../constants';
import * as selectors from '../selectors';
import * as DA from '../actions';
import Log from './Log';

import * as EditorSelectors from '../../editor/selectors';
import * as EditorActions from '../../editor/actions';

const contextMenuAttrs = {
  className: 'contextmenu filter-button',
};

const DEPLOYMENT_PANEL_FILTER_CONTEXT_MENU_ID =
  'DEPLOYMENT_PANEL_FILTER_CONTEXT_MENU_ID';

const checkmark = active => (active ? <span className="state">✔</span> : null);

const TAB_NAMES = {
  [LOG_TAB_TYPE.INSTALLER]: 'Installer',
  [LOG_TAB_TYPE.COMPILER]: 'Compiler',
  [LOG_TAB_TYPE.UPLOADER]: 'Uploader',
  [LOG_TAB_TYPE.DEBUGGER]: 'Debugger',
  [LOG_TAB_TYPE.TESTER]: 'Tester',
};

const TAB_ORDER = [
  LOG_TAB_TYPE.INSTALLER,
  LOG_TAB_TYPE.COMPILER,
  LOG_TAB_TYPE.UPLOADER,
  LOG_TAB_TYPE.DEBUGGER,
  LOG_TAB_TYPE.TESTER,
];

class Debugger extends React.Component {
  renderControlsForExpandedState() {
    const {
      isExpanded,
      isCapturingDebuggerProtocolMessages,
      actions,
    } = this.props;

    if (!isExpanded) return null;

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
          <MenuItem onClick={actions.toggleCapturingDebuggerProtocolMessages}>
            {checkmark(isCapturingDebuggerProtocolMessages)}
            Watched Values
          </MenuItem>
        </ContextMenu>
      </React.Fragment>
    );
  }

  renderTabSelector() {
    const { currentTab, actions } = this.props;

    return (
      <ul role="menu" className="tab-selector">
        {TAB_ORDER.map(tabName => (
          <li // eslint-disable-line jsx-a11y/no-static-element-interactions
            role="menuitem"
            key={tabName}
            onClick={() => actions.selectTab(tabName)}
            className={cn('tab', { active: tabName === currentTab })}
          >
            {TAB_NAMES[tabName]}
          </li>
        ))}
      </ul>
    );
  }

  render() {
    const {
      maybeUploadProgress,
      actions,
      onUploadClick,
      onUploadAndDebugClick,
      isExpanded,
      isTabtestRunning,
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

    return (
      <div className={cn('Debugger', { isCollapsed: !isExpanded })}>
        <div className="titlebar">
          <div // eslint-disable-line jsx-a11y/no-static-element-interactions
            role="button"
            className="expander"
            onClick={actions.toggleDebugger}
          >
            <span className="title">Deployment</span>

            <div className="progress">
              {uploadProgress}
              {isTabtestRunning ? (
                <Icon
                  Component="button"
                  className="abort-tabtest-button"
                  name="ban"
                  title="Abort Test"
                  onClickCapture={e => {
                    e.stopPropagation();
                    actions.abortTabtest();
                  }}
                />
              ) : null}
            </div>
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
          <React.Fragment>
            {this.renderTabSelector()}
            <div className="container">
              <Log />
            </div>
          </React.Fragment>
        ) : null}
      </div>
    );
  }
}

Debugger.propTypes = {
  maybeUploadProgress: PropTypes.object.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  isCapturingDebuggerProtocolMessages: PropTypes.bool.isRequired,
  isTabtestRunning: PropTypes.bool.isRequired,
  currentTab: PropTypes.string.isRequired,
  actions: PropTypes.objectOf(PropTypes.func),
  onUploadClick: PropTypes.func.isRequired,
  onUploadAndDebugClick: PropTypes.func.isRequired,
};

const mapStateToProps = R.applySpec({
  maybeUploadProgress: selectors.getUploadProgress,
  currentTab: selectors.getCurrentDebuggerTab,
  isExpanded: selectors.isDebuggerVisible,
  isCapturingDebuggerProtocolMessages:
    selectors.isCapturingDebuggerProtocolMessages,
  isTabtestRunning: EditorSelectors.isTabtestRunning,
});
const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(
    {
      toggleDebugger: DA.toggleDebugger,
      toggleCapturingDebuggerProtocolMessages:
        DA.toggleCapturingDebuggerProtocolMessages,
      clearLog: DA.clearDebuggerLog,
      selectTab: DA.selectDebuggerTab,
      abortTabtest: EditorActions.abortTabtest,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(Debugger);
