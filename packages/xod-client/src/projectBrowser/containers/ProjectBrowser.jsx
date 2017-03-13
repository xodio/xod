import R from 'ramda';
import React from 'react';
import cn from 'classnames';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Icon } from 'react-fa';
import { HotKeys } from 'react-hotkeys';

import core from 'xod-core';
import * as ProjectActions from '../../project/actions';
import * as ProjectBrowserActions from '../actions';
import * as EditorActions from '../../editor/actions';

import * as ProjectBrowserSelectors from '../selectors';
import * as EditorSelectors from '../../editor/selectors';

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

const splitNames = R.compose(
  R.map(R.join('/')),
  R.splitAt(2),
  R.split('/')
);

const userPatchIds = R.compose(
  R.filter(
    R.pipe(R.head, R.equals('@'))
  ),
  R.keys
);

class ProjectBrowser2 extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.patchRenderers = {
      [PATCH_TYPE.MY]: this.renderMyPatches.bind(this),
      [PATCH_TYPE.LIBRARY]: this.renderLibraryPatches.bind(this),
    };

    this.renderPatches = this.renderPatches.bind(this);
    this.deselectIfInLibrary = this.deselectIfInLibrary.bind(this);
    this.deselectIfInMyPatches = this.deselectIfInMyPatches.bind(this);

    this.onRenameHotkey = this.onRenameHotkey.bind(this);
    this.onDeleteHotkey = this.onDeleteHotkey.bind(this);
  }

  onAddNode(id) {
    // TODO: rewrite this when implementing "zombie" nodes
    this.props.actions.setSelectedNodeType(id);
    this.props.actions.setEditorMode(EDITOR_MODE.CREATING_NODE);
  }

  onRenameHotkey() {
    const { selectedPatchId } = this.props;
    if (!selectedPatchId || !this.isSelectedPatchInCurrentProject()) return;

    this.props.actions.requestRename(selectedPatchId);
  }

  onDeleteHotkey() {
    const { selectedPatchId } = this.props;
    if (!selectedPatchId || !this.isSelectedPatchInCurrentProject()) return;

    this.props.actions.requestDelete(selectedPatchId);
  }

  getHotkeyHandlers() {
    return {
      [COMMAND.ADD_PATCH]: this.props.actions.requestCreatePatch,
      [COMMAND.RENAME]: this.onRenameHotkey,
      [COMMAND.DELETE]: this.onDeleteHotkey,
      [COMMAND.ESCAPE]: this.props.actions.removeSelection,
    };
  }

  isSelectedPatchInCurrentProject() {
    const { patches, selectedPatchId } = this.props;

    return R.compose(
      R.lt(-1),
      R.indexOf(selectedPatchId),
      R.keys
    )(patches);
  }

  myPatchesHoveredButtons(id) {
    const { currentPatchId, nodeTypes } = this.props;
    const {
      requestRename,
      requestDelete,
    } = this.props.actions;

    const patchIsAddable = R.pipe(R.keys, R.indexOf(id), R.lt(-1))(nodeTypes);
    // TODO: when we'll implement adding with dnd, this will not be sufficient
    const canAdd = patchIsAddable && currentPatchId !== id;

    const addButtonClassnames = cn('hover-button', {
      disabled: !canAdd,
    });
    const addButtonAction = canAdd
      ? () => this.onAddNode(id)
      : noop;

    return [
      <Icon
        key="delete"
        name="trash"
        className="hover-button"
        onClick={() => requestDelete(id)}
      />,
      <Icon
        key="rename"
        name="pencil"
        className="hover-button"
        onClick={() => requestRename(id)}
      />,
      <Icon
        key="add"
        name="plus-circle"
        className={addButtonClassnames}
        onClick={addButtonAction}
      />,
    ];
  }

  deselectIfInMyPatches() {
    if (this.isSelectedPatchInCurrentProject()) {
      this.props.actions.removeSelection();
    }
  }

  deselectIfInLibrary(libName) {
    return () => {
      const { libs, selectedPatchId } = this.props;

      const isInClosedLib = R.compose(
        R.pipe(R.isNil, R.not),
        R.find(R.propEq('id', selectedPatchId)),
        R.prop(libName)
      )(libs);

      if (isInClosedLib) {
        this.props.actions.removeSelection();
      }
    };
  }

  renderMyPatches() {
    const {
      projectName,
      patches,
      currentPatchId,
      selectedPatchId,
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
        onClose={this.deselectIfInMyPatches}
      >
        {R.map(({ id, label }) => (
          <PatchGroupItem
            key={id}
            label={label}
            isOpen={id === currentPatchId}
            onDoubleClick={() => switchPatch(id)}
            isSelected={id === selectedPatchId}
            onClick={() => setSelection(id)}
            hoverButtons={this.myPatchesHoveredButtons(id)}
          />
        ), R.values(patches))}
      </PatchGroup>
    );
  }

  renderLibraryPatches() {
    const { libs, selectedPatchId } = this.props;
    const { setSelection } = this.props.actions;

    return R.toPairs(libs).map(([libName, types]) => (
      <PatchGroup
        key={libName}
        type="library"
        name={libName}
        onClose={this.deselectIfInLibrary(libName)}
      >
        {types.map(({ id }) =>
          <PatchGroupItem
            key={id}
            label={R.pipe(splitNames, R.nth(1))(id)}
            isSelected={id === selectedPatchId}
            onClick={() => setSelection(id)}
            hoverButtons={[
              <Icon
                key="add"
                name="plus-circle"
                className="hover-button"
                onClick={() => this.onAddNode(id)}
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

    // TODO: wrap in component with a custom scrollbar
    return (
      <div style={{ height: 400, overflow: 'scroll', backgroundColor: '#3d3d3d' }}>
        {rendererKeys.map(k => this.patchRenderers[k]())}
      </div>
    );
  }

  render() {
    return (
      <HotKeys
        handlers={this.getHotkeyHandlers()}
        className="ProjectBrowser"
      >
        <ProjectBrowserPopups
          selectedPatchId={this.props.selectedPatchId}
          openPopups={this.props.openPopups}
          patches={this.props.patches}
          projectName={this.props.projectName}
          onPatchDelete={this.props.actions.deletePatch}
          onPatchRename={this.props.actions.renamePatch}
          onProjectRename={this.props.actions.renameProject}
          onPatchCreate={this.props.actions.addPatch}
          closeAllPopups={this.props.actions.closeAllPopups}
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

ProjectBrowser2.displayName = 'ProjectBrowser';

ProjectBrowser2.propTypes = {
  projectName: React.PropTypes.string.isRequired,
  currentPatchId: React.PropTypes.string.isRequired,
  selectedPatchId: React.PropTypes.string,
  patches: React.PropTypes.object.isRequired,
  openPopups: React.PropTypes.object.isRequired,
  nodeTypes: React.PropTypes.object.isRequired,
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
  }),
};

const mapStateToProps = (state) => {
  const project = core.getProject(state);
  const projectMeta = core.getMeta(project);
  const projectName = core.getName(projectMeta);
  const currentPatchId = EditorSelectors.getCurrentPatchId(state);

  const nodeTypes = core.dereferencedNodeTypes(state);
  const libs = R.compose(
    R.map(
      R.sort(R.ascend(R.prop('id')))
    ),
    R.groupBy(
      R.pipe(R.prop('id'), splitNames, R.head)
    ),
    R.values,
    R.omit(userPatchIds(nodeTypes))
  )(nodeTypes);

  return {
    projectName,
    currentPatchId,
    selectedPatchId: ProjectBrowserSelectors.getSelectedPatchId(state),
    patches: core.getPatches(state),
    openPopups: state.projectBrowser.openPopups,
    nodeTypes,
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
  }, dispatch),
});


export default connect(mapStateToProps, mapDispatchToProps)(ProjectBrowser2);
