import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { HotKeys, FocusTrap } from 'react-hotkeys';
import * as XP from 'xod-project';
import { Icon } from 'react-fa';
import debounce from 'throttle-debounce/debounce';

import * as Actions from '../actions';
import * as ProjectActions from '../../project/actions';
import * as ProjectSelectors from '../../project/selectors';
import * as DebuggerSelectors from '../../debugger/selectors';
import * as EditorSelectors from '../selectors';

import { isInputTarget } from '../../utils/browser';
import { COMMAND } from '../../utils/constants';
import { FOCUS_AREAS, DEBUGGER_TAB_ID, TAB_TYPES, IMPL_TEMPLATE, SIDEBAR_IDS } from '../constants';

import Patch from './Patch';
import CppImplementationEditor from '../components/CppImplementationEditor';
import NoPatch from '../components/NoPatch';
import Suggester from '../components/Suggester';
import PanelContextMenu from '../components/PanelContextMenu';
import LibSuggester from '../components/LibSuggester';
import Debugger from '../../debugger/containers/Debugger';
import Breadcrumbs from '../../debugger/containers/Breadcrumbs';
import Sidebar from './Sidebar';
import SnackBar from '../../messages/containers/SnackBar';
import Helpbox from './Helpbox';

import Tabs from './Tabs';
import DragLayer from './DragLayer';

class Editor extends React.Component {
  constructor(props) {
    super(props);

    this.getHotkeyHandlers = this.getHotkeyHandlers.bind(this);
    this.toggleHelp = this.toggleHelp.bind(this);
    this.onAddNode = this.onAddNode.bind(this);
    this.onInstallLibrary = this.onInstallLibrary.bind(this);
    this.showSuggester = this.showSuggester.bind(this);
    this.hideSuggester = this.hideSuggester.bind(this);

    this.onWorkareaFocus = this.onWorkareaFocus.bind(this);
    this.onLibSuggesterFocus = this.onLibSuggesterFocus.bind(this);

    this.patchSize = this.props.size;

    this.updatePatchImplementationDebounced =
      debounce(300, this.props.actions.updatePatchImplementation);
  }

  onAddNode(patchPath) {
    // TODO: rewrite this when implementing "zombie" nodes
    const position = this.props.suggesterPlacePosition || this.props.defaultNodePosition;

    this.hideSuggester();
    this.props.actions.addNode(
      patchPath,
      position,
      this.props.currentPatchPath
    );
  }

  onInstallLibrary(libParams) {
    return this.props.actions.installLibraries([libParams]);
  }
  onWorkareaFocus() {
    this.props.actions.setFocusedArea(FOCUS_AREAS.WORKAREA);
  }
  onLibSuggesterFocus() {
    this.props.actions.setFocusedArea(FOCUS_AREAS.LIB_SUGGESTER);
  }

  getHotkeyHandlers() {
    return {
      [COMMAND.UNDO]: () => this.props.actions.undo(this.props.currentPatchPath),
      [COMMAND.REDO]: () => this.props.actions.redo(this.props.currentPatchPath),
      [COMMAND.HIDE_HELPBOX]: () => this.props.actions.hideHelpbox(),
      [COMMAND.TOGGLE_HELP]: this.toggleHelp,
      [COMMAND.INSERT_NODE]: (event) => {
        if (isInputTarget(event)) return;
        this.showSuggester(null);
      },
    };
  }

  toggleHelp(e) {
    if (isInputTarget(e)) return;

    this.props.actions.toggleHelp();
  }

  showSuggester(placePosition) {
    this.props.actions.showSuggester(placePosition);
  }

  hideSuggester() {
    this.props.actions.hideSuggester();
  }

  renderOpenedPatchTab() {
    const { currentTab, currentPatchPath } = this.props;

    if (currentTab === null) return <NoPatch />;

    if (!currentTab.isEditingCppImplementation) {
      return (
        <Patch
          ref={(el) => { this.patchRef = el; }}
          patchPath={currentPatchPath}
          size={this.patchSize}
          onDoubleClick={this.showSuggester}
        />
      );
    }

    return null;
  }

  renderOpenedImplementationEditorTabs() {
    const { currentTab } = this.props;

    if (!currentTab) return null;

    const tabs = this.props.implEditorTabs.map(({ id, type, patchPath }) => {
      const patch = XP.getPatchByPathUnsafe(patchPath, this.props.project);
      const source = XP.getImpl(patch).getOrElse(IMPL_TEMPLATE);

      const onChange = src => this.updatePatchImplementationDebounced(patchPath, src);

      return (
        <CppImplementationEditor
          key={id}
          isActive={id === currentTab.id}
          source={source}
          onChange={onChange}
          isInDebuggerTab={type === TAB_TYPES.DEBUGGER}
          onClose={this.props.actions.closeImplementationEditor}
          patchPath={this.props.currentPatchPath}
        />
      );
    });

    return (
      <div
        className={cn('CppImplementationEditors', {
          hidden: currentTab && !currentTab.isEditingCppImplementation,
        })}
      >
        {tabs}
      </div>
    );
  }

  render() {
    const {
      patchesIndex,
    } = this.props;

    const suggester = (this.props.suggesterIsVisible) ? (
      <Suggester
        index={patchesIndex}
        onAddNode={this.onAddNode}
        onBlur={this.hideSuggester}
        onHighlight={this.props.actions.highlightSugessterItem}
        showHelpbox={this.props.actions.showHelpbox}
        hideHelpbox={this.props.actions.hideHelpbox}
      />
    ) : null;

    const libSuggester = (this.props.isLibSuggesterVisible) ? (
      <LibSuggester
        extraClassName="Suggester--library"
        onInstallLibrary={this.onInstallLibrary}
        onBlur={this.props.actions.hideLibSuggester}
        onInitialFocus={this.onLibSuggesterFocus}
      />
    ) : null;

    const BreadcrumbsContainer = R.pathEq(['currentTab', 'id'], DEBUGGER_TAB_ID, this.props)
      ? <Breadcrumbs />
      : null;

    const DebugSessionStopButton = (
      this.props.isDebugSessionRunning &&
      this.props.stopDebuggerSession
    ) ? (
      <button
        className="debug-session-stop-button Button Button--light"
        onClick={this.props.stopDebuggerSession}
      >
        <Icon name="stop" /> Stop debug
      </button>
    ) : null;

    return (
      <HotKeys handlers={this.getHotkeyHandlers()} className="Editor" id="Editor">
        <Sidebar
          id={SIDEBAR_IDS.LEFT}
          windowSize={this.props.size}
        />
        {suggester}
        {libSuggester}
        <FocusTrap
          className="Workarea"
          onFocus={this.onWorkareaFocus}
        >
          <Tabs />
          <div className="Workarea-inner">
            {DebugSessionStopButton}
            {this.renderOpenedPatchTab()}
            {BreadcrumbsContainer}
            {this.renderOpenedImplementationEditorTabs()}
            <SnackBar />
          </div>
          <Debugger
            onUploadClick={this.props.onUploadClick}
            onUploadAndDebugClick={this.props.onUploadAndDebugClick}
          />
        </FocusTrap>
        <Sidebar
          id={SIDEBAR_IDS.RIGHT}
          windowSize={this.props.size}
        />
        <DragLayer />
        {this.props.isHelpboxVisible && <Helpbox />}
        <PanelContextMenu
          onMinimizeClick={this.props.actions.minimizePanel}
          onSwitchSideClick={this.props.actions.movePanel}
          onAutohideClick={this.props.actions.togglePanelAutohide}
        />
      </HotKeys>
    );
  }
}

Editor.propTypes = {
  size: PropTypes.object.isRequired,
  currentPatchPath: PropTypes.string,
  project: PropTypes.object,
  currentTab: PropTypes.object,
  implEditorTabs: PropTypes.array,
  patchesIndex: PropTypes.object,
  isHelpboxVisible: PropTypes.bool,
  isDebugSessionRunning: PropTypes.bool,
  suggesterIsVisible: PropTypes.bool,
  suggesterPlacePosition: PropTypes.object,
  isLibSuggesterVisible: PropTypes.bool,
  defaultNodePosition: PropTypes.object.isRequired,
  stopDebuggerSession: PropTypes.func,
  onUploadClick: PropTypes.func.isRequired,
  onUploadAndDebugClick: PropTypes.func.isRequired,
  actions: PropTypes.shape({
    updatePatchImplementation: PropTypes.func.isRequired,
    closeImplementationEditor: PropTypes.func.isRequired,
    undo: PropTypes.func.isRequired,
    redo: PropTypes.func.isRequired,
    toggleHelp: PropTypes.func.isRequired,
    setFocusedArea: PropTypes.func.isRequired,
    addNode: PropTypes.func.isRequired,
    showSuggester: PropTypes.func.isRequired,
    hideSuggester: PropTypes.func.isRequired,
    highlightSugessterItem: PropTypes.func.isRequired,
    hideLibSuggester: PropTypes.func.isRequired,
    installLibraries: PropTypes.func.isRequired,
    minimizePanel: PropTypes.func.isRequired,
    movePanel: PropTypes.func.isRequired,
    togglePanelAutohide: PropTypes.func.isRequired,
    hideHelpbox: PropTypes.func.isRequired,
    showHelpbox: PropTypes.func.isRequired,
  }),
};

const mapStateToProps = R.applySpec({
  selection: ProjectSelectors.getRenderableSelection,
  currentPatch: ProjectSelectors.getCurrentPatch,
  project: ProjectSelectors.getProject, // TODO: probably should not bring the whole project
  currentPatchPath: EditorSelectors.getCurrentPatchPath,
  currentTab: EditorSelectors.getCurrentTab,
  implEditorTabs: EditorSelectors.getImplEditorTabs,
  patchesIndex: ProjectSelectors.getPatchSearchIndex,
  suggesterIsVisible: EditorSelectors.isSuggesterVisible,
  suggesterPlacePosition: EditorSelectors.getSuggesterPlacePosition,
  isLibSuggesterVisible: EditorSelectors.isLibSuggesterVisible,
  isHelpboxVisible: EditorSelectors.isHelpboxVisible,
  isDebugSessionRunning: DebuggerSelectors.isDebugSession,
  defaultNodePosition: EditorSelectors.getDefaultNodePlacePosition,
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    updateNodeProperty: ProjectActions.updateNodeProperty,
    updatePatchDescription: ProjectActions.updatePatchDescription,
    updatePatchImplementation: ProjectActions.updatePatchImplementation,
    closeImplementationEditor: Actions.closeImplementationEditor,
    undo: ProjectActions.undoPatch,
    redo: ProjectActions.redoPatch,
    toggleHelp: Actions.toggleHelp,
    setFocusedArea: Actions.setFocusedArea,
    addNode: ProjectActions.addNode,
    showSuggester: Actions.showSuggester,
    hideSuggester: Actions.hideSuggester,
    highlightSugessterItem: Actions.highlightSugessterItem,
    hideLibSuggester: Actions.hideLibSuggester,
    installLibraries: Actions.installLibraries,
    minimizePanel: Actions.minimizePanel,
    movePanel: Actions.movePanel,
    togglePanelAutohide: Actions.togglePanelAutohide,
    hideHelpbox: Actions.hideHelpbox,
    showHelpbox: Actions.showHelpbox,
  }, dispatch),
});

export default R.compose(
  connect(mapStateToProps, mapDispatchToProps),
  DragDropContext(HTML5Backend) // eslint-disable-line new-cap
)(Editor);
