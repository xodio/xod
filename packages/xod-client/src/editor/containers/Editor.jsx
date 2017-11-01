import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import $ from 'sanctuary-def';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { HotKeys, FocusTrap } from 'react-hotkeys';
import { Patch as PatchType } from 'xod-project';
import { $Maybe } from 'xod-func-tools';
import { Icon } from 'react-fa';

import * as Actions from '../actions';
import * as ProjectActions from '../../project/actions';
import * as ProjectSelectors from '../../project/selectors';
import * as DebuggerSelectors from '../../debugger/selectors';
import * as EditorSelectors from '../selectors';

import { isInputTarget } from '../../utils/browser';
import { COMMAND } from '../../utils/constants';
import { FOCUS_AREAS, DEBUGGER_TAB_ID } from '../constants';

import Patch from './Patch';
import NoPatch from '../components/NoPatch';
import Suggester from '../components/Suggester';
import Inspector from '../components/Inspector';
import Debugger from '../../debugger/containers/Debugger';
import Breadcrumbs from '../../debugger/containers/Breadcrumbs';
import Sidebar from '../../utils/components/Sidebar';
import Workarea from '../../utils/components/Workarea';

import { RenderableSelection } from '../../types';
import sanctuaryPropType from '../../utils/sanctuaryPropType';

import ProjectBrowser from '../../projectBrowser/containers/ProjectBrowser';
import Tabs from './Tabs';
import Helpbar from './Helpbar';
import DragLayer from './DragLayer';

class Editor extends React.Component {
  constructor(props) {
    super(props);

    this.getHotkeyHandlers = this.getHotkeyHandlers.bind(this);
    this.toggleHelpbar = this.toggleHelpbar.bind(this);
    this.onAddNode = this.onAddNode.bind(this);
    this.showSuggester = this.showSuggester.bind(this);
    this.hideSuggester = this.hideSuggester.bind(this);

    this.patchSize = this.props.size;
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

  getHotkeyHandlers() {
    return {
      [COMMAND.UNDO]: () => this.props.actions.undo(this.props.currentPatchPath),
      [COMMAND.REDO]: () => this.props.actions.redo(this.props.currentPatchPath),
      [COMMAND.TOGGLE_HELPBAR]: this.toggleHelpbar,
      [COMMAND.INSERT_NODE]: (event) => {
        if (isInputTarget(event)) return;
        this.showSuggester(null);
      },
    };
  }

  toggleHelpbar(e) {
    if (isInputTarget(e)) return;

    this.props.actions.toggleHelpbar();
  }

  showSuggester(placePosition) {
    this.props.actions.showSuggester(placePosition);
  }

  hideSuggester() {
    this.props.actions.hideSuggester();
  }

  render() {
    const {
      currentPatchPath,
      currentPatch,
      selection,
      patchesIndex,
    } = this.props;

    const openedPatch = currentPatchPath
      ? (
        <Patch
          ref={(el) => { this.patchRef = el; }}
          patchPath={currentPatchPath}
          size={this.patchSize}
          onDoubleClick={this.showSuggester}
        />
      ) : (
        <NoPatch />
      );

    const suggester = (this.props.suggesterIsVisible) ? (
      <Suggester
        addClassName={(this.props.isHelpbarVisible) ? 'with-helpbar' : ''}
        index={patchesIndex}
        onAddNode={this.onAddNode}
        onBlur={this.hideSuggester}
        onHighlight={this.props.actions.highlightSugessterItem}
      />
    ) : null;

    const DebuggerContainer = (this.props.isDebuggerVisible) ? <Debugger /> : null;
    const BreadcrumbsContainer = (
      this.props.isDebuggerVisible &&
      this.props.currentTabId === DEBUGGER_TAB_ID
    ) ? <Breadcrumbs /> : null;

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
      <HotKeys handlers={this.getHotkeyHandlers()} className="Editor">
        <Sidebar>
          <FocusTrap
            className="ProjectBrowser-container"
            onFocus={() => this.props.actions.setFocusedArea(FOCUS_AREAS.PROJECT_BROWSER)}
          >
            <ProjectBrowser />
          </FocusTrap>
          <FocusTrap
            className="Inspector-container"
            onFocus={() => this.props.actions.setFocusedArea(FOCUS_AREAS.INSPECTOR)}
          >
            <Inspector
              selection={selection}
              currentPatch={currentPatch}
              onPropUpdate={this.props.actions.updateNodeProperty}
              onPatchDescriptionUpdate={this.props.actions.updatePatchDescription}
            />
          </FocusTrap>
        </Sidebar>
        <FocusTrap
          className="Workarea-container"
          onFocus={() => this.props.actions.setFocusedArea(FOCUS_AREAS.WORKAREA)}
        >
          <Workarea>
            <Tabs />
            {DebugSessionStopButton}
            {openedPatch}
            {suggester}
            {DebuggerContainer}
            {BreadcrumbsContainer}
          </Workarea>
        </FocusTrap>
        <Helpbar />
        <DragLayer />
      </HotKeys>
    );
  }
}

Editor.propTypes = {
  size: PropTypes.object.isRequired,
  selection: sanctuaryPropType($.Array(RenderableSelection)),
  currentPatchPath: PropTypes.string,
  currentPatch: sanctuaryPropType($Maybe(PatchType)),
  currentTabId: PropTypes.string,
  patchesIndex: PropTypes.object,
  isHelpbarVisible: PropTypes.bool,
  isDebuggerVisible: PropTypes.bool,
  isDebugSessionRunning: PropTypes.bool,
  suggesterIsVisible: PropTypes.bool,
  suggesterPlacePosition: PropTypes.object,
  defaultNodePosition: PropTypes.object.isRequired,
  stopDebuggerSession: PropTypes.func,
  actions: PropTypes.shape({
    updateNodeProperty: PropTypes.func.isRequired,
    updatePatchDescription: PropTypes.func.isRequired,
    undo: PropTypes.func.isRequired,
    redo: PropTypes.func.isRequired,
    toggleHelpbar: PropTypes.func.isRequired,
    setFocusedArea: PropTypes.func.isRequired,
    addNode: PropTypes.func.isRequired,
    showSuggester: PropTypes.func.isRequired,
    hideSuggester: PropTypes.func.isRequired,
    highlightSugessterItem: PropTypes.func.isRequired,
  }),
};

const mapStateToProps = R.applySpec({
  selection: ProjectSelectors.getRenderableSelection,
  currentPatch: ProjectSelectors.getCurrentPatch,
  currentPatchPath: EditorSelectors.getCurrentPatchPath,
  currentTabId: EditorSelectors.getCurrentTabId,
  patchesIndex: ProjectSelectors.getPatchSearchIndex,
  suggesterIsVisible: EditorSelectors.isSuggesterVisible,
  suggesterPlacePosition: EditorSelectors.getSuggesterPlacePosition,
  isHelpbarVisible: EditorSelectors.isHelpbarVisible,
  isDebuggerVisible: DebuggerSelectors.isDebuggerVisible,
  isDebugSessionRunning: DebuggerSelectors.isDebugSession,
  defaultNodePosition: EditorSelectors.getDefaultNodePlacePosition,
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    updateNodeProperty: ProjectActions.updateNodeProperty,
    updatePatchDescription: ProjectActions.updatePatchDescription,
    undo: ProjectActions.undoPatch,
    redo: ProjectActions.redoPatch,
    toggleHelpbar: Actions.toggleHelpbar,
    setFocusedArea: Actions.setFocusedArea,
    addNode: ProjectActions.addNode,
    showSuggester: Actions.showSuggester,
    hideSuggester: Actions.hideSuggester,
    highlightSugessterItem: Actions.highlightSugessterItem,
  }, dispatch),
});

export default R.compose(
  connect(mapStateToProps, mapDispatchToProps),
  DragDropContext(HTML5Backend) // eslint-disable-line new-cap
)(Editor);
