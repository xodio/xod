import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { ContextMenuTrigger, ContextMenu, MenuItem } from 'react-contextmenu';
import { Icon } from 'react-fa';
import { foldMaybe } from 'xod-func-tools';
import { Maybe } from 'ramda-fantasy';

import { LOG_TAB_TYPE } from '../constants';
import { PANEL_IDS } from '../../editor/constants';
import * as selectors from '../selectors';
import { addError, addConfirmation } from '../../messages/actions';
import * as DA from '../actions';
import {
  LOG_COPIED,
  LOG_COPY_NOT_SUPPORTED,
  logCopyError,
  logSaveError,
} from '../messages';

import Log from './Log';
import SerialInput from '../components/SerialInput';

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
  [LOG_TAB_TYPE.DEBUGGER]: 'Serial',
  [LOG_TAB_TYPE.TESTER]: 'Tester',
};

const TAB_ORDER = [
  LOG_TAB_TYPE.INSTALLER,
  LOG_TAB_TYPE.COMPILER,
  LOG_TAB_TYPE.UPLOADER,
  LOG_TAB_TYPE.DEBUGGER,
  LOG_TAB_TYPE.TESTER,
];

class Debugger extends React.PureComponent {
  constructor(props) {
    super(props);

    this.onCopyLogClicked = this.onCopyLogClicked.bind(this);
    this.onSaveLogClicked = this.onSaveLogClicked.bind(this);
  }

  onCopyLogClicked() {
    const copy = R.path(['navigator', 'clipboard', 'writeText'], window);
    if (!copy) {
      this.props.actions.addError(LOG_COPY_NOT_SUPPORTED);
      return;
    }

    window.navigator.clipboard.writeText(this.props.log).then(
      () => {
        this.props.actions.addConfirmation(LOG_COPIED);
      },
      err => {
        this.props.actions.addError(logCopyError(err));
      }
    );
  }

  onSaveLogClicked() {
    const tabLabel = TAB_NAMES[this.props.currentTab];
    const defaultFilename = R.compose(R.concat(R.__, '-log.txt'), R.toLower)(
      tabLabel
    );

    try {
      const data = new window.Blob([this.props.log], { type: 'text/plain' });
      const file = window.URL.createObjectURL(data);

      const link = document.createElement('a');
      link.download = defaultFilename;
      link.href = file;
      link.click();

      // We need to manually revoke the object URL to avoid memory leaks.
      window.URL.revokeObjectURL(file);
    } catch (err) {
      this.props.actions.addError(logSaveError(err));
    }
  }

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

  renderTabActions() {
    const isDisabled = R.isEmpty(this.props.log);
    return (
      <React.Fragment>
        <li role="menuitem" key="save" className="tab-action">
          <Icon
            name="save"
            Component="button"
            size="lg"
            onClick={this.onSaveLogClicked}
            title="Download Log"
            disabled={isDisabled}
            className="save-log"
          />
        </li>
        <li role="menuitem" key="copy" className="tab-action">
          <Icon
            name="copy"
            Component="button"
            size="lg"
            onClick={this.onCopyLogClicked}
            title="Copy Log"
            disabled={isDisabled}
            className="copy-log"
          />
        </li>
      </React.Fragment>
    );
  }

  renderTabSelector() {
    const { currentTab, actions } = this.props;

    return (
      <ul role="menu" className="tab-selector">
        {this.renderTabActions()}
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
      isSimulationAbortable,
      onRunSimulationClick,
      isConnectedToSerial,
      stopDebuggerSession,
      currentTab,
      isResizing,
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

    const isDebuggerTab = currentTab === LOG_TAB_TYPE.DEBUGGER;
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
                  className="abort-process-button"
                  name="ban"
                  title="Abort Test"
                  onClickCapture={e => {
                    e.stopPropagation();
                    actions.abortTabtest();
                  }}
                />
              ) : null}

              {isSimulationAbortable && Maybe.isJust(maybeUploadProgress) ? (
                <Icon
                  Component="button"
                  className="abort-process-button"
                  name="ban"
                  title="Stop Simulation"
                  onClickCapture={e => {
                    e.stopPropagation();
                    actions.abortSimulation();
                  }}
                />
              ) : null}

              {isConnectedToSerial ? (
                <Icon
                  Component="button"
                  className="abort-process-button"
                  name="ban"
                  title="Stop Session"
                  onClickCapture={e => {
                    e.stopPropagation();
                    stopDebuggerSession();
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
            name="gamepad"
            className="simulation-button"
            title="Simulate"
            onClick={onRunSimulationClick}
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
              <Log compact={isDebuggerTab} doNotSkipLines={isResizing} />
              {isDebuggerTab ? (
                <SerialInput
                  disabled={!isConnectedToSerial}
                  onSend={actions.sendToSerial}
                />
              ) : null}
            </div>
          </React.Fragment>
        ) : null}
      </div>
    );
  }
}

Debugger.defaultProps = {
  isResizing: false,
};

Debugger.propTypes = {
  isResizing: PropTypes.bool,
  log: PropTypes.string.isRequired,
  maybeUploadProgress: PropTypes.object.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  isConnectedToSerial: PropTypes.bool.isRequired,
  isCapturingDebuggerProtocolMessages: PropTypes.bool.isRequired,
  isTabtestRunning: PropTypes.bool.isRequired,
  isSimulationAbortable: PropTypes.bool.isRequired,
  currentTab: PropTypes.string.isRequired,
  actions: PropTypes.objectOf(PropTypes.func),
  onUploadClick: PropTypes.func.isRequired,
  onUploadAndDebugClick: PropTypes.func.isRequired,
  onRunSimulationClick: PropTypes.func.isRequired,
  stopDebuggerSession: PropTypes.func.isRequired,
};

const mapStateToProps = R.applySpec({
  log: selectors.getLogForCurrentTab,
  maybeUploadProgress: selectors.getUploadProgress,
  currentTab: selectors.getCurrentDebuggerTab,
  isExpanded: EditorSelectors.isPanelMaximized(PANEL_IDS.DEPLOYMENT),
  isConnectedToSerial: selectors.isSessionActive,
  isCapturingDebuggerProtocolMessages:
    selectors.isCapturingDebuggerProtocolMessages,
  isTabtestRunning: EditorSelectors.isTabtestRunning,
  isSimulationAbortable: selectors.isSimulationAbortable,
});

const toggleDeploymentPane = () =>
  EditorActions.togglePanel(PANEL_IDS.DEPLOYMENT);

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(
    {
      toggleDebugger: toggleDeploymentPane,
      sendToSerial: DA.sendToSerial,
      toggleCapturingDebuggerProtocolMessages:
        DA.toggleCapturingDebuggerProtocolMessages,
      clearLog: DA.clearDebuggerLog,
      selectTab: DA.selectDebuggerTab,
      abortTabtest: EditorActions.abortTabtest,
      abortSimulation: EditorActions.abortSimulation,
      addError,
      addConfirmation,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(Debugger);
