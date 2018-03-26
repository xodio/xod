import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Icon } from 'react-fa';
import { HotKeys } from 'react-hotkeys';
import { ContextMenuTrigger, ContextMenu, MenuItem } from 'react-contextmenu';

import $ from 'sanctuary-def';
import {
  Patch,
  getLibraryName,
  isPathLocal,
  getBaseName,
  PatchPath,
} from 'xod-project';
import { isAmong, notEquals, $Maybe, foldMaybe } from 'xod-func-tools';

import * as ProjectActions from '../../project/actions';
import * as ProjectBrowserActions from '../actions';
import * as EditorActions from '../../editor/actions';
import * as MessagesActions from '../../messages/actions';
import * as PopupActions from '../../popups/actions';

import * as ProjectBrowserSelectors from '../selectors';
import * as PopupSelectors from '../../popups/selectors';
import * as EditorSelectors from '../../editor/selectors';

import { COMMAND } from '../../utils/constants';
import sanctuaryPropType from '../../utils/sanctuaryPropType';

import SidebarPanel from '../../editor/components/SidebarPanel';
import PatchGroup from '../components/PatchGroup';
import PatchGroupItem from '../components/PatchGroupItem';
import ProjectBrowserPopups from '../components/ProjectBrowserPopups';
import PatchGroupItemContextMenu from '../components/PatchGroupItemContextMenu';

import {
  PATCH_GROUP_CONTEXT_MENU_ID,
  FILTER_CONTEXT_MENU_ID,
} from '../constants';
import { PANEL_IDS, SIDEBAR_IDS } from '../../editor/constants';
import { triggerUpdateHelpboxPositionViaProjectBrowser } from '../../editor/utils';

const pickPatchPartsForComparsion = R.map(
  R.pick(['isDeprecated', 'isUtility', 'dead', 'path'])
);

const checkmark = active => (active ? <span className="state">✔</span> : null);

const pickPropsForComparsion = R.compose(
  R.evolve({
    localPatches: pickPatchPartsForComparsion,
    libs: R.map(pickPatchPartsForComparsion),
  }),
  R.omit(['actions'])
);

class ProjectBrowser extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.renderPatches = this.renderPatches.bind(this);
    this.deselectIfInLibrary = this.deselectIfInLibrary.bind(this);
    this.deselectIfInLocalPatches = this.deselectIfInLocalPatches.bind(this);

    this.onAddNode = this.onAddNode.bind(this);
    this.onRenameHotkey = this.onRenameHotkey.bind(this);
    this.onDeleteHotkey = this.onDeleteHotkey.bind(this);
    this.onClickAddLibrary = this.onClickAddLibrary.bind(this);
    this.onPatchHelpClicked = this.onPatchHelpClicked.bind(this);

    this.renderItem = this.renderItem.bind(this);
    this.renderLocalPatches = this.renderLocalPatches.bind(this);
    this.renderLibraryPatches = this.renderLibraryPatches.bind(this);
  }
  componentDidMount() {
    triggerUpdateHelpboxPositionViaProjectBrowser();
  }
  shouldComponentUpdate(nextProps) {
    return !R.eqBy(pickPropsForComparsion, nextProps, this.props);
  }

  onAddNode(patchPath) {
    this.props.currentPatchPath.map(curPatchPath =>
      this.props.actions.addNode(
        patchPath,
        this.props.defaultNodePosition,
        curPatchPath
      )
    );
  }

  onRenameHotkey() {
    const { selectedPatchPath } = this.props;
    if (!isPathLocal(selectedPatchPath)) return;

    this.props.actions.requestRename(selectedPatchPath);
  }

  onDeleteHotkey() {
    const { selectedPatchPath } = this.props;
    if (!isPathLocal(selectedPatchPath)) return;

    this.props.actions.requestDelete(selectedPatchPath);
  }

  onClickAddLibrary(event) {
    event.stopPropagation();
    this.props.actions.showLibSuggester();
  }

  onPatchHelpClicked() {
    this.props.actions.showHelpbox();
  }

  getHotkeyHandlers() {
    return {
      [COMMAND.ADD_PATCH]: this.props.actions.requestCreatePatch,
      [COMMAND.RENAME]: this.onRenameHotkey,
      [COMMAND.DELETE]: this.onDeleteHotkey,
      [COMMAND.ESCAPE]: this.props.actions.removeSelection,
    };
  }

  getCollectPropsFn(patchPath) {
    const canAdd = foldMaybe(
      false,
      notEquals(patchPath),
      this.props.currentPatchPath
    );

    return () => ({
      patchPath,
      canAdd,
      isLocalPatch: isPathLocal(patchPath),
    });
  }

  deselectIfInLocalPatches() {
    if (isPathLocal(this.props.selectedPatchPath)) {
      this.props.actions.removeSelection();
    }
  }

  deselectIfInLibrary(libName) {
    return () => {
      if (getLibraryName(this.props.selectedPatchPath || '') === libName) {
        this.props.actions.removeSelection();
      }
    };
  }

  // eslint-disable-next-line class-methods-use-this
  renderHoveredButtons(collectPropsFn) {
    return [
      <ContextMenuTrigger
        key="contextMenuTrigger"
        id={PATCH_GROUP_CONTEXT_MENU_ID}
        renderTag="div"
        attributes={{
          className: 'contextmenu',
        }}
        collect={collectPropsFn}
        holdToDisplay={0}
      >
        {/* Component needs at least one child :-( */}
        <span />
      </ContextMenuTrigger>,
    ];
  }

  renderItem({ path, dead, isDeprecated, isUtility }) {
    const { currentPatchPath, selectedPatchPath } = this.props;

    const isOpen = foldMaybe(false, R.equals(path), currentPatchPath);

    const {
      switchPatch,
      setSelection,
      startDraggingPatch,
    } = this.props.actions;

    const collectPropsFn = this.getCollectPropsFn(path);

    const key = [
      path,
      isDeprecated ? '_isDeprecated' : '',
      isUtility ? '_utility' : '',
    ].join('');

    return (
      <PatchGroupItem
        key={key}
        patchPath={path}
        dead={dead}
        isDeprecated={isDeprecated}
        isUtility={isUtility}
        label={getBaseName(path)}
        isOpen={isOpen}
        onDoubleClick={() => switchPatch(path)}
        onBeginDrag={startDraggingPatch}
        isSelected={path === selectedPatchPath}
        onClick={event => {
          triggerUpdateHelpboxPositionViaProjectBrowser(event);
          setSelection(path);
        }}
        collectPropsFn={collectPropsFn}
        hoverButtons={this.renderHoveredButtons(collectPropsFn)}
      />
    );
  }

  renderLocalPatches() {
    const { projectName, localPatches } = this.props;

    return (
      <PatchGroup
        key="@"
        type="my"
        name={projectName}
        onClose={this.deselectIfInLocalPatches}
      >
        {localPatches.map(this.renderItem)}
      </PatchGroup>
    );
  }

  renderLibraryPatches() {
    const { libs, installingLibs } = this.props;
    const installingLibsComponents = R.map(
      ({ owner, name, version }) => ({
        name: `${owner}/${name}`,
        component: (
          <div
            key={`${owner}/${name}/${version}`}
            className="PatchGroup PatchGroup--installing library"
          >
            <span className="name">
              {owner}/{name}
            </span>
            <span className="version">{version}</span>
            <Icon name="circle-o-notch" spin />
          </div>
        ),
      }),
      installingLibs
    );
    const installingLibNames = R.pluck('name', installingLibsComponents);

    // :: [(Patch -> Boolean)]
    const rejectPatchFunctions = R.compose(
      R.pluck(1),
      R.reject(R.propEq(0, false))
    )([
      [!this.props.showDeprecated, R.propEq('isDeprecated', true)],
      [!this.props.showUtilityPatches, R.propEq('isUtility', true)],
    ]);

    // Rejecting of patches with markers by selected filter options
    // is implemented in the component for better performance.
    // :: { LibName: [Patch] } -> { LibName: [Patch] }
    const rejectPatchesByFilterOptions = R.map(
      R.reject(R.anyPass(rejectPatchFunctions))
    );

    const libComponents = R.compose(
      R.reject(R.compose(isAmong(installingLibNames), R.prop('name'))),
      R.map(([libName, libPatches]) => ({
        name: libName,
        component: (
          <PatchGroup
            key={libName}
            type="library"
            name={libName}
            onClose={this.deselectIfInLibrary(libName)}
          >
            {libPatches.map(this.renderItem)}
          </PatchGroup>
        ),
      })),
      R.toPairs,
      rejectPatchesByFilterOptions
    )(libs);

    return R.compose(
      R.map(R.prop('component')),
      R.sortBy(R.prop('name')),
      R.concat
    )(libComponents, installingLibsComponents);
  }

  renderPatches() {
    return (
      <div className="patches-list">
        {this.renderLocalPatches()}
        {this.renderLibraryPatches()}
      </div>
    );
  }

  renderToolbarButtons() {
    return [
      <button
        key="addPatchButton"
        className="newpatch"
        title="Add patch"
        onClick={this.props.actions.requestCreatePatch}
      />,
      <button
        key="addLibButton"
        className="addlib"
        title="Add library"
        onClick={this.onClickAddLibrary}
      />,
      <ContextMenuTrigger
        id={FILTER_CONTEXT_MENU_ID}
        key="contextMenuTrigger"
        renderTag="button"
        attributes={{
          className: 'filter',
        }}
        holdToDisplay={0}
      >
        <span />
      </ContextMenuTrigger>,
    ];
  }

  render() {
    return (
      <HotKeys
        handlers={this.getHotkeyHandlers()}
        id="ProjectBrowser"
        className="ProjectBrowser"
      >
        <ProjectBrowserPopups
          selectedPatchPath={this.props.selectedPatchPath}
          selectedPatchName={this.props.selectedPatchLabel}
          projectName={this.props.projectName}
          popups={this.props.popups}
          onPatchDelete={this.props.actions.deletePatch}
          onPatchRename={this.props.actions.renamePatch}
          onPatchCreate={this.props.actions.addPatch}
          onCloseAllPopups={this.props.actions.closeAllPopups}
        />
        <SidebarPanel
          id={PANEL_IDS.PROJECT_BROWSER}
          title="Project Browser"
          sidebarId={this.props.sidebarId}
          autohide={this.props.autohide}
          additionalButtons={this.renderToolbarButtons()}
          onScroll={triggerUpdateHelpboxPositionViaProjectBrowser}
        >
          {this.renderPatches()}
        </SidebarPanel>
        <PatchGroupItemContextMenu
          ref={c => {
            this.patchContextMenuRef = c;
          }}
          onPatchAdd={this.onAddNode}
          onPatchOpen={this.props.actions.switchPatch}
          onPatchDelete={this.props.actions.requestDelete}
          onPatchRename={this.props.actions.requestRename}
          onPatchHelp={this.onPatchHelpClicked}
        />
        <ContextMenu id={FILTER_CONTEXT_MENU_ID}>
          <MenuItem onClick={this.props.actions.toggleDeprecatedFilter}>
            {checkmark(this.props.showDeprecated)}
            Deprecated nodes
          </MenuItem>
          <MenuItem onClick={this.props.actions.toggleUtilityFilter}>
            {checkmark(this.props.showUtilityPatches)}
            Utility nodes
          </MenuItem>
        </ContextMenu>
      </HotKeys>
    );
  }
}

ProjectBrowser.displayName = 'ProjectBrowser';

ProjectBrowser.propTypes = {
  projectName: PropTypes.string.isRequired,
  currentPatchPath: sanctuaryPropType($Maybe(PatchPath)),
  selectedPatchPath: PropTypes.string,
  selectedPatchLabel: PropTypes.string.isRequired,
  localPatches: sanctuaryPropType($.Array(Patch)),
  popups: PropTypes.object.isRequired,
  libs: sanctuaryPropType($.StrMap($.Array(Patch))),
  installingLibs: PropTypes.array,
  defaultNodePosition: PropTypes.object.isRequired,
  sidebarId: PropTypes.oneOf(R.values(SIDEBAR_IDS)).isRequired,
  autohide: PropTypes.bool.isRequired,
  showDeprecated: PropTypes.bool.isRequired,
  showUtilityPatches: PropTypes.bool.isRequired,
  actions: PropTypes.shape({
    addNode: PropTypes.func.isRequired,
    switchPatch: PropTypes.func.isRequired,
    requestCreatePatch: PropTypes.func.isRequired,
    requestRename: PropTypes.func.isRequired,
    requestDelete: PropTypes.func.isRequired,
    setSelection: PropTypes.func.isRequired,
    removeSelection: PropTypes.func.isRequired,
    addPatch: PropTypes.func.isRequired,
    renamePatch: PropTypes.func.isRequired,
    deletePatch: PropTypes.func.isRequired,
    startDraggingPatch: PropTypes.func.isRequired,
    closeAllPopups: PropTypes.func.isRequired,
    showLibSuggester: PropTypes.func.isRequired,
    showHelpbox: PropTypes.func.isRequired,
    toggleDeprecatedFilter: PropTypes.func.isRequired,
    toggleUtilityFilter: PropTypes.func.isRequired,
  }),
};

const mapStateToProps = R.applySpec({
  projectName: ProjectBrowserSelectors.getProjectName,
  currentPatchPath: EditorSelectors.getCurrentPatchPath,
  selectedPatchPath: ProjectBrowserSelectors.getSelectedPatchPath,
  selectedPatchLabel: ProjectBrowserSelectors.getSelectedPatchLabel,
  localPatches: ProjectBrowserSelectors.getLocalPatches,
  popups: PopupSelectors.getProjectBrowserPopups,
  libs: ProjectBrowserSelectors.getLibs,
  installingLibs: ProjectBrowserSelectors.getInstallingLibraries,
  defaultNodePosition: EditorSelectors.getDefaultNodePlacePosition,
  showDeprecated: ProjectBrowserSelectors.shouldShowDeprecatedPatches,
  showUtilityPatches: ProjectBrowserSelectors.shouldShowUtilityPatches,
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(
    {
      setEditorMode: EditorActions.setMode,
      switchPatch: EditorActions.switchPatch,
      startDraggingPatch: EditorActions.startDraggingPatch,

      requestCreatePatch: ProjectBrowserActions.requestCreatePatch,
      requestRename: ProjectBrowserActions.requestRenamePatch,
      requestDelete: ProjectBrowserActions.requestDeletePatch,
      setSelection: ProjectBrowserActions.setSelection,
      removeSelection: ProjectBrowserActions.removeSelection,

      addNode: ProjectActions.addNode,
      addPatch: ProjectActions.addPatch,
      renamePatch: ProjectActions.renamePatch,
      deletePatch: ProjectActions.deletePatch,

      closeAllPopups: PopupActions.hideAllPopups,

      addNotification: MessagesActions.addNotification,
      showLibSuggester: EditorActions.showLibSuggester,
      showHelpbox: EditorActions.showHelpbox,

      toggleDeprecatedFilter: ProjectBrowserActions.toggleDeprecatedFilter,
      toggleUtilityFilter: ProjectBrowserActions.toggleUtilityFilter,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(ProjectBrowser);
