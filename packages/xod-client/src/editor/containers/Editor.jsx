import * as R from 'ramda';
import React from 'react';
import $ from 'sanctuary-def';
import PropTypes from 'prop-types';
import cn from 'classnames';
import { $Maybe, explodeMaybe, foldMaybe } from 'xod-func-tools';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { HotKeys, FocusTrap } from 'react-hotkeys';
import * as XP from 'xod-project';
import debounce from 'throttle-debounce/debounce';

import * as Actions from '../actions';
import * as ProjectActions from '../../project/actions';
import * as ProjectSelectors from '../../project/selectors';
import * as DebuggerSelectors from '../../debugger/selectors';
import * as EditorSelectors from '../selectors';

import { isInputTarget } from '../../utils/browser';
import { COMMAND } from '../../utils/constants';
import sanctuaryPropType from '../../utils/sanctuaryPropType';
import { FOCUS_AREAS, TAB_TYPES, SIDEBAR_IDS } from '../constants';

import Patch from './Patch';
import CppImplementationEditor from '../components/CppImplementationEditor';
import TabtestEditor from '../components/TabtestEditor';
import NoPatch from '../components/NoPatch';
import Suggester from '../components/Suggester';
import PanelContextMenu from '../components/PanelContextMenu';
import LibSuggester from '../components/LibSuggester';
import Debugger from '../../debugger/containers/Debugger';
import DebuggerTopPane from '../../debugger/containers/DebuggerTopPane';
import Sidebar from './Sidebar';
import SnackBar from '../../messages/containers/SnackBar';
import Helpbox from './Helpbox';

import Tooltip from '../../tooltip/components/Tooltip';

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

    this.updatePatchAttachmentDebounced = debounce(
      300,
      this.props.actions.updatePatchAttachment
    );
  }

  onAddNode(patchPath) {
    // TODO: rewrite this when implementing "zombie" nodes
    const position =
      this.props.suggesterPlacePosition || this.props.defaultNodePosition;

    this.hideSuggester();
    this.props.currentPatchPath.map(currentPatchPath =>
      this.props.actions.addNode(patchPath, position, currentPatchPath)
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
      [COMMAND.HIDE_HELPBOX]: () => this.props.actions.hideHelpbox(),
      [COMMAND.TOGGLE_HELP]: this.toggleHelp,
      [COMMAND.INSERT_NODE]: event => {
        if (isInputTarget(event)) return;
        this.showSuggester(null);
      },
      [COMMAND.PAN_TO_ORIGIN]: this.props.actions.panToOrigin,
      [COMMAND.PAN_TO_CENTER]: this.props.actions.panToCenter,
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

    return foldMaybe(
      <NoPatch />,
      tab => {
        // Do not render <Patch /> component if opened tab
        // is in EditingCppImplementation mode.
        if (tab.editedAttachment) return null;

        // If we reached here, we're sure that tab contains
        // all the necessary data and just explode them up
        // to pass it into <Patch />
        const curPatchPath = explodeMaybe(
          'Current tab should contain PatchPath to render <Patch /> component, but its not. \n' +
            `Check it out: ${JSON.stringify(tab, null, 2)}`,
          currentPatchPath
        );
        return (
          <Patch
            ref={el => {
              this.patchRef = el;
            }}
            patchPath={curPatchPath}
            tabType={tab.type}
            size={this.patchSize}
            onDoubleClick={this.showSuggester}
          />
        );
      },
      currentTab
    );
  }

  renderOpenedAttachmentEditorTabs() {
    return foldMaybe(
      null,
      currentTab => {
        const tabs = this.props.attachmentEditorTabs.map(
          ({ id, type, patchPath, editedAttachment }) => {
            const patch = XP.getPatchByPathUnsafe(
              patchPath,
              this.props.project
            );
            const attachmentContents = XP.getAttachmentManagedByMarker(
              editedAttachment,
              patch
            ).getOrElse(
              R.propOr('', editedAttachment, XP.MANAGED_ATTACHMENT_TEMPLATES)
            );

            const currentPatchPath = explodeMaybe(
              'No currentPatchPath, but currentTab exists',
              this.props.currentPatchPath
            );

            switch (editedAttachment) {
              case XP.TABTEST_MARKER_PATH:
                return (
                  <TabtestEditor
                    key={id}
                    isActive={id === currentTab.id}
                    source={attachmentContents}
                    onChange={newContents =>
                      this.props.actions.updatePatchAttachment(
                        patchPath,
                        editedAttachment,
                        newContents
                      )
                    }
                    isInDebuggerTab={type === TAB_TYPES.DEBUGGER}
                    isRunning={this.props.isTabtestRunning}
                    onRunClick={() =>
                      this.props.actions.runTabtest(currentPatchPath)
                    }
                    onClose={this.props.actions.closeAttachmentEditor}
                    patchPath={currentPatchPath}
                  />
                );

              case XP.NOT_IMPLEMENTED_IN_XOD_PATH:
                return (
                  <CppImplementationEditor
                    key={id}
                    isActive={id === currentTab.id}
                    source={attachmentContents}
                    onChange={newContents =>
                      this.updatePatchAttachmentDebounced(
                        patchPath,
                        editedAttachment,
                        newContents
                      )
                    }
                    isInDebuggerTab={type === TAB_TYPES.DEBUGGER}
                    onClose={this.props.actions.closeAttachmentEditor}
                    patchPath={currentPatchPath}
                  />
                );

              default:
                // Should happen only if there’s a bug in XOD IDE
                throw new Error(`Unknown attachment type ${editedAttachment}`);
            }
          }
        );

        return (
          <div
            className={cn('AttachmentEditors', {
              hidden: currentTab && !currentTab.editedAttachment,
            })}
          >
            {tabs}
          </div>
        );
      },
      this.props.currentTab
    );
  }

  render() {
    const { searchPatches } = this.props;

    const suggester = this.props.suggesterIsVisible ? (
      <Suggester
        searchPatches={searchPatches}
        onAddNode={this.onAddNode}
        onBlur={this.hideSuggester}
        onHighlight={this.props.actions.highlightSugessterItem}
        showHelpbox={this.props.actions.showHelpbox}
        hideHelpbox={this.props.actions.hideHelpbox}
      />
    ) : null;

    const libSuggester = this.props.isLibSuggesterVisible ? (
      <LibSuggester
        extraClassName="Suggester--library"
        onInstallLibrary={this.onInstallLibrary}
        onBlur={this.props.actions.hideLibSuggester}
        onInitialFocus={this.onLibSuggesterFocus}
      />
    ) : null;

    return (
      <HotKeys
        handlers={this.getHotkeyHandlers()}
        className="Editor"
        id="Editor"
      >
        <Sidebar id={SIDEBAR_IDS.LEFT} windowSize={this.props.size} />
        {suggester}
        {libSuggester}
        <FocusTrap className="Workarea" onFocus={this.onWorkareaFocus}>
          <Tabs />
          <DebuggerTopPane
            currentTab={this.props.currentTab}
            isDebugSessionRunning={this.props.isDebugSessionRunning}
            isDebugSessionOutdated={this.props.isDebugSessionOutdated}
            stopDebuggerSession={this.props.stopDebuggerSession}
          />
          <div className="Workarea-inner">
            {this.renderOpenedPatchTab()}
            {this.renderOpenedAttachmentEditorTabs()}
            <SnackBar />
          </div>
          <Debugger
            stopDebuggerSession={this.props.stopDebuggerSession}
            onUploadClick={this.props.onUploadClick}
            onUploadAndDebugClick={this.props.onUploadAndDebugClick}
            onRunSimulationClick={this.props.onRunSimulationClick}
          />
        </FocusTrap>
        <Sidebar id={SIDEBAR_IDS.RIGHT} windowSize={this.props.size} />
        <DragLayer />
        {this.props.isHelpboxVisible && <Helpbox />}
        <PanelContextMenu
          onMinimizeClick={this.props.actions.minimizePanel}
          onSwitchSideClick={this.props.actions.movePanel}
          onAutohideClick={this.props.actions.togglePanelAutohide}
        />
        <Tooltip />
      </HotKeys>
    );
  }
}

Editor.propTypes = {
  size: PropTypes.object.isRequired,
  currentPatchPath: sanctuaryPropType($Maybe(XP.PatchPath)),
  project: PropTypes.object,
  currentTab: sanctuaryPropType($Maybe($.Object)),
  attachmentEditorTabs: PropTypes.array,
  searchPatches: PropTypes.func.isRequired,
  isHelpboxVisible: PropTypes.bool,
  isDebugSessionRunning: PropTypes.bool,
  isDebugSessionOutdated: PropTypes.bool,
  suggesterIsVisible: PropTypes.bool,
  suggesterPlacePosition: PropTypes.object,
  isLibSuggesterVisible: PropTypes.bool,
  defaultNodePosition: PropTypes.object.isRequired,
  stopDebuggerSession: PropTypes.func,
  onUploadClick: PropTypes.func.isRequired,
  onUploadAndDebugClick: PropTypes.func.isRequired,
  isTabtestRunning: PropTypes.bool.isRequired,
  onRunSimulationClick: PropTypes.func.isRequired,
  actions: PropTypes.shape({
    updatePatchAttachment: PropTypes.func.isRequired,
    closeAttachmentEditor: PropTypes.func.isRequired,
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
    panToOrigin: PropTypes.func.isRequired,
    panToCenter: PropTypes.func.isRequired,
    runTabtest: PropTypes.func.isRequired,
  }),
};

const mapStateToProps = R.applySpec({
  selection: ProjectSelectors.getRenderableSelection,
  currentPatch: ProjectSelectors.getCurrentPatch,
  project: ProjectSelectors.getProject, // TODO: probably should not bring the whole project
  currentPatchPath: EditorSelectors.getCurrentPatchPath,
  currentTab: EditorSelectors.getCurrentTab,
  attachmentEditorTabs: EditorSelectors.getAttachmentEditorTabs,
  searchPatches: ProjectSelectors.getSearchPatchesFn,
  suggesterIsVisible: EditorSelectors.isSuggesterVisible,
  suggesterPlacePosition: EditorSelectors.getSuggesterPlacePosition,
  isLibSuggesterVisible: EditorSelectors.isLibSuggesterVisible,
  isHelpboxVisible: EditorSelectors.isHelpboxVisible,
  isDebugSessionRunning: DebuggerSelectors.isDebugSession,
  isDebugSessionOutdated: DebuggerSelectors.isDebugSessionOutdated,
  defaultNodePosition: EditorSelectors.getDefaultNodePlacePosition,
  isTabtestRunning: EditorSelectors.isTabtestRunning,
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(
    {
      updateNodeProperty: ProjectActions.updateNodeProperty,
      updatePatchDescription: ProjectActions.updatePatchDescription,
      updatePatchAttachment: ProjectActions.updatePatchAttachment,
      closeAttachmentEditor: Actions.closeAttachmentEditor,
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
      panToOrigin: Actions.setCurrentPatchOffsetToOrigin,
      panToCenter: Actions.setCurrentPatchOffsetToCenter,
      runTabtest: Actions.runTabtest,
    },
    dispatch
  ),
});

export default R.compose(
  connect(mapStateToProps, mapDispatchToProps),
  DragDropContext(HTML5Backend) // eslint-disable-line new-cap
)(Editor);
