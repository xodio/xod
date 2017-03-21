import R from 'ramda';
import React from 'react';
import cn from 'classnames';
import CustomScroll from 'react-custom-scroll';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Icon } from 'react-fa';
import { HotKeys } from 'react-hotkeys';

import {
  getProjectName,
  listLocalPatches,
  listLibraryPatches,
  getLibraryName,
  getPatchPath,
  isPathLocal,
  getBaseName,
  listPins,
  getPatchLabel,
  getPatchByPath,
} from 'xod-project';

import * as ProjectActions from '../../project/actions';
import * as ProjectBrowserActions from '../actions';
import * as EditorActions from '../../editor/actions';
import * as MessagesActions from '../../messages/actions';
import { PROJECT_BROWSER_ERRORS } from '../../messages/constants';

import * as ProjectBrowserSelectors from '../selectors';
import * as EditorSelectors from '../../editor/selectors';
import { getProjectV2 } from '../../project/selectors';

import { EDITOR_MODE } from '../../editor/constants';
import { COMMAND } from '../../utils/constants';
import { noop } from '../../utils/ramda';

import PatchGroup from '../components/PatchGroup';
import PatchGroupItem from '../components/PatchGroupItem';
import PatchTypeSelector from '../components/PatchTypeSelector';
import ProjectBrowserPopups from '../components/ProjectBrowserPopups';
import ProjectBrowserToolbar from '../components/ProjectBrowserToolbar';

const PATCH_TYPE = {
  ALL: 'all',
  MY: 'my',
  LIBRARY: 'library',
};

class ProjectBrowser extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.patchRenderers = {
      [PATCH_TYPE.MY]: this.renderLocalPatches.bind(this),
      [PATCH_TYPE.LIBRARY]: this.renderLibraryPatches.bind(this),
    };

    this.renderPatches = this.renderPatches.bind(this);
    this.deselectIfInLibrary = this.deselectIfInLibrary.bind(this);
    this.deselectIfInLocalPatches = this.deselectIfInLocalPatches.bind(this);

    this.onRenameHotkey = this.onRenameHotkey.bind(this);
    this.onDeleteHotkey = this.onDeleteHotkey.bind(this);
  }

  onAddNode(patchPath) {
    // TODO: rewrite this when implementing "zombie" nodes
    this.props.actions.setSelectedNodeType(patchPath);
    this.props.actions.setEditorMode(EDITOR_MODE.CREATING_NODE);
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

  getHotkeyHandlers() {
    return {
      [COMMAND.ADD_PATCH]: this.props.actions.requestCreatePatch,
      [COMMAND.RENAME]: this.onRenameHotkey,
      [COMMAND.DELETE]: this.onDeleteHotkey,
      [COMMAND.ESCAPE]: this.props.actions.removeSelection,
    };
  }

  localPatchesHoveredButtons(patchPath) {
    const { currentPatchPath, localPatches } = this.props;
    const {
      requestRename,
      requestDelete,
    } = this.props.actions;

    const patch = R.find(
      R.pipe(getPatchPath, R.equals(patchPath)),
      localPatches
    );

    const hasPins = patch && R.pipe(listPins, R.complement(R.isEmpty))(patch);
    // TODO: we also need detection of more complex cases
    const isAddingRecursively = currentPatchPath === patchPath;

    const canAdd = hasPins && !isAddingRecursively;
    // TODO: when we'll implement adding with dnd, disabling button will not be sufficient
    const addButtonClassnames = cn('hover-button', {
      disabled: !canAdd,
    });
    const addButtonAction = canAdd
      ? () => this.onAddNode(patchPath)
      : noop;

    return [
      <Icon
        key="delete"
        name="trash"
        className="hover-button"
        onClick={() => requestDelete(patchPath)}
      />,
      <Icon
        key="rename"
        name="pencil"
        className="hover-button"
        onClick={() => requestRename(patchPath)}
      />,
      <Icon
        key="add"
        name="plus-circle"
        className={addButtonClassnames}
        onClick={addButtonAction}
      />,
    ];
  }

  deselectIfInLocalPatches() {
    if (isPathLocal(this.props.selectedPatchPath)) {
      this.props.actions.removeSelection();
    }
  }

  deselectIfInLibrary(libName) {
    return () => {
      if (getLibraryName(this.props.selectedPatchPath) === libName) {
        this.props.actions.removeSelection();
      }
    };
  }

  renderLocalPatches() {
    const {
      projectName,
      localPatches,
      currentPatchPath,
      selectedPatchPath,
    } = this.props;
    const {
      switchPatch,
      setSelection,
    } = this.props.actions;

    return (
      <PatchGroup
        key="@"
        type="my"
        name={projectName}
        onClose={this.deselectIfInLocalPatches}
      >
        {R.map(({ path, label }) => (
          <PatchGroupItem
            key={path}
            label={label}
            isOpen={path === currentPatchPath}
            onDoubleClick={() => switchPatch(path)}
            isSelected={path === selectedPatchPath}
            onClick={() => setSelection(path)}
            hoverButtons={this.localPatchesHoveredButtons(path)}
          />
        ), localPatches)}
      </PatchGroup>
    );
  }

  renderLibraryPatches() {



    return R.toPairs(libs).map(([libName, libPatches]) => (
      <PatchGroup
        key={libName}
        type="library"
        name={libName}
        onClose={this.deselectIfInLibrary(libName)}
      >
        {libPatches.map(({ path }) =>
          <PatchGroupItem
            key={path}
            label={getBaseName(path)}
            isSelected={path === selectedPatchPath}
            onClick={() => setSelection(path)}
            hoverButtons={[
              <Icon
                key="add"
                name="plus-circle"
                className="hover-button"
                onClick={() => this.onAddNode(path)}
              />,
            ]}
          />
        )}
      </PatchGroup>
    ));
  }

  renderPatches(patchType) {
    const rendererKeys = patchType === PATCH_TYPE.ALL
      ? [PATCH_TYPE.MY, PATCH_TYPE.LIBRARY]
      : R.of(patchType);

    return (
      <CustomScroll>
        <div className="patches-list">
          {rendererKeys.map(k => this.patchRenderers[k]())}
        </div>
      </CustomScroll>
    );
  }

  render() {
    return (
      <HotKeys
        handlers={this.getHotkeyHandlers()}
        className="ProjectBrowser"
      >
        <ProjectBrowserPopups
          selectedPatchPath={this.props.selectedPatchPath}
          selectedPatchName={this.props.selectedPatchLabel}
          projectName={this.props.projectName}
          openPopups={this.props.openPopups}
          onPatchDelete={this.props.actions.deletePatch}
          onPatchRename={this.props.actions.renamePatch}
          onProjectRename={this.props.actions.renameProject}
          onPatchCreate={this.props.actions.addPatch}
          onCloseAllPopups={this.props.actions.closeAllPopups}
        />
        <ProjectBrowserToolbar
          onClickAddPatch={this.props.actions.requestCreatePatch}
        />
        <PatchTypeSelector
          options={[
            { key: PATCH_TYPE.ALL, name: 'All' },
            { key: PATCH_TYPE.LIBRARY, name: 'Libraries' },
            { key: PATCH_TYPE.MY, name: 'My Patches' },
          ]}
          onChange={this.props.actions.removeSelection}
        >
          {this.renderPatches}
        </PatchTypeSelector>
      </HotKeys>
    );
  }
}

ProjectBrowser.displayName = 'ProjectBrowser';

ProjectBrowser.propTypes = {
  projectName: React.PropTypes.string.isRequired,
  currentPatchPath: React.PropTypes.string,
  selectedPatchPath: React.PropTypes.string,
  selectedPatchLabel: React.PropTypes.string.isRequired,
  localPatches: React.PropTypes.array.isRequired,
  openPopups: React.PropTypes.object.isRequired,
  libs: React.PropTypes.object.isRequired,
  actions: React.PropTypes.shape({
    setSelectedNodeType: React.PropTypes.func.isRequired,
    setEditorMode: React.PropTypes.func.isRequired,
    switchPatch: React.PropTypes.func.isRequired,
    requestCreatePatch: React.PropTypes.func.isRequired,
    requestRename: React.PropTypes.func.isRequired,
    requestDelete: React.PropTypes.func.isRequired,
    setSelection: React.PropTypes.func.isRequired,
    removeSelection: React.PropTypes.func.isRequired,
    addPatch: React.PropTypes.func.isRequired,
    renamePatch: React.PropTypes.func.isRequired,
    deletePatch: React.PropTypes.func.isRequired,
    renameProject: React.PropTypes.func.isRequired,
    closeAllPopups: React.PropTypes.func.isRequired,
    addNotification: React.PropTypes.func.isRequired,
  }),
};

const mapStateToProps = (state) => {
  const currentPatchPath = EditorSelectors.getCurrentPatchId(state);

  const projectV2 = getProjectV2(state);
  const projectName = getProjectName(projectV2);
  const localPatches = listLocalPatches(projectV2);

  const libs = R.compose(
    R.map(
      R.sort(R.ascend(getPatchPath))
    ),
    R.groupBy(
      R.pipe(getPatchPath, getLibraryName)
    ),
    listLibraryPatches
  )(projectV2);

  const selectedPatchPath = ProjectBrowserSelectors.getSelectedPatchId(state);

  const selectedPatchLabel =
    getPatchByPath(selectedPatchPath || '', projectV2)
      .map(getPatchLabel)
      .getOrElse('');

  return {
    projectName,
    currentPatchPath,
    selectedPatchPath,
    selectedPatchLabel,
    localPatches,
    openPopups: state.projectBrowser.openPopups,
    libs,
  };
};

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    setSelectedNodeType: EditorActions.setSelectedNodeType,
    setEditorMode: EditorActions.setMode,
    switchPatch: EditorActions.switchPatch,

    requestCreatePatch: ProjectBrowserActions.requestCreatePatch,
    requestRename: ProjectBrowserActions.requestRenamePatch,
    requestDelete: ProjectBrowserActions.requestDeletePatch,
    setSelection: ProjectBrowserActions.setSelection,
    removeSelection: ProjectBrowserActions.removeSelection,

    addPatch: ProjectActions.addPatch,
    renamePatch: ProjectActions.renamePatch,
    deletePatch: ProjectActions.deletePatch,
    renameProject: ProjectActions.renameProject,

    closeAllPopups: ProjectBrowserActions.cancelPopup,

    addNotification: MessagesActions.addNotification,
  }, dispatch),
});


export default connect(mapStateToProps, mapDispatchToProps)(ProjectBrowser);
