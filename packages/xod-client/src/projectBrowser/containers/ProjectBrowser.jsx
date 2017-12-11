import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import CustomScroll from 'react-custom-scroll';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Icon } from 'react-fa';
import { HotKeys } from 'react-hotkeys';

import $ from 'sanctuary-def';
import {
  Patch,
  getLibraryName,
  isPathLocal,
  getBaseName,
} from 'xod-project';
import { isAmong } from 'xod-func-tools';

import * as ProjectActions from '../../project/actions';
import * as ProjectBrowserActions from '../actions';
import * as EditorActions from '../../editor/actions';
import * as MessagesActions from '../../messages/actions';
import * as PopupActions from '../../popups/actions';

import * as ProjectBrowserSelectors from '../selectors';
import * as PopupSelectors from '../../popups/selectors';
import * as EditorSelectors from '../../editor/selectors';

import { COMMAND } from '../../utils/constants';
import { noop } from '../../utils/ramda';
import sanctuaryPropType from '../../utils/sanctuaryPropType';

import PatchGroup from '../components/PatchGroup';
import PatchGroupItem from '../components/PatchGroupItem';
import PatchTypeSelector from '../components/PatchTypeSelector';
import ProjectBrowserPopups from '../components/ProjectBrowserPopups';
import ProjectBrowserToolbar from '../components/ProjectBrowserToolbar';

import { getUtmSiteUrl } from '../../utils/urls';
import { IconGuide } from '../../utils/components/IconGuide';

const PATCH_TYPE = {
  ALL: 'all',
  MY: 'my',
  LIBRARY: 'library',
};

const pickPatchPartsForComparsion = R.map(R.pick(['dead', 'path']));

const pickPropsForComparsion = R.compose(
  R.evolve({
    localPatches: pickPatchPartsForComparsion,
    libs: pickPatchPartsForComparsion,
  }),
  R.pick([
    'projectName',
    'currentPatchPath',
    'selectedPatchPath',
    'selectedPatchLabel',
    'localPatches',
    'popups',
    'libs',
    'installingLibs',
    'defaultNodePosition',
  ])
);

class ProjectBrowser extends React.Component {
  constructor(props) {
    super(props);
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

  shouldComponentUpdate(nextProps) {
    return !R.eqBy(
      pickPropsForComparsion,
      nextProps,
      this.props
    );
  }

  onAddNode(patchPath) {
    this.props.actions.addNode(
      patchPath,
      this.props.defaultNodePosition,
      this.props.currentPatchPath
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

  getHotkeyHandlers() {
    return {
      [COMMAND.ADD_PATCH]: this.props.actions.requestCreatePatch,
      [COMMAND.RENAME]: this.onRenameHotkey,
      [COMMAND.DELETE]: this.onDeleteHotkey,
      [COMMAND.ESCAPE]: this.props.actions.removeSelection,
    };
  }

  localPatchesHoveredButtons(patchPath) {
    const {
      requestRename,
      requestDelete,
    } = this.props.actions;

    return [
      <Icon
        key="delete"
        name="trash"
        title="Delete patch"
        className="hover-button"
        onClick={() => requestDelete(patchPath)}
      />,
      <Icon
        key="rename"
        name="pencil"
        title="Rename patch"
        className="hover-button"
        onClick={() => requestRename(patchPath)}
      />,
      this.renderAddNodeButton(patchPath),
    ];
  }

  libraryPatchesHoveredButtons(path) {
    return [
      this.renderDocsButton(path),
      this.renderAddNodeButton(path),
    ];
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

  renderAddNodeButton(patchPath) {
    const { currentPatchPath } = this.props;

    const isCurrentPatch = currentPatchPath === patchPath;
    const canAdd = !isCurrentPatch;

    const classNames = cn('hover-button add-node', { disabled: !canAdd });
    const action = canAdd ? () => this.onAddNode(patchPath) : noop;

    return (
      <Icon
        key="add"
        name="plus-circle"
        title="Add node"
        className={classNames}
        onClick={action}
      />
    );
  }

  renderDocsButton(patchPath) { // eslint-disable-line class-methods-use-this
    return (
      <a
        href={getUtmSiteUrl(`/libs/${patchPath}`, 'docs', 'project-browser')}
        target="_blank"
        rel="noopener noreferrer"
        className="hover-button"
        key="patch-guide-button"
        title="Open documentation in web browser"
      >
        <IconGuide
          className="project-browser--guide-button"
          width="14px"
          height="14px"
          fill="#FFF"
        />
      </a>
    );
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
      startDraggingPatch,
    } = this.props.actions;

    const renderItem = ({ path, dead }) => (
      <PatchGroupItem
        key={path}
        patchPath={path}
        dead={dead}
        label={getBaseName(path)}
        isOpen={path === currentPatchPath}
        onDoubleClick={() => switchPatch(path)}
        onBeginDrag={startDraggingPatch}
        isSelected={path === selectedPatchPath}
        onClick={() => setSelection(path)}
        hoverButtons={this.localPatchesHoveredButtons(path)}
      />
    );

    return (
      <PatchGroup
        key="@"
        type="my"
        name={projectName}
        onClose={this.deselectIfInLocalPatches}
      >
        {R.map(renderItem, localPatches)}
      </PatchGroup>
    );
  }

  renderLibraryPatches() {
    const { libs, installingLibs, selectedPatchPath } = this.props;
    const { setSelection, switchPatch, startDraggingPatch } = this.props.actions;
    const installingLibsComponents = R.map(
      ({ owner, name, version }) => ({
        name: `${owner}/${name}`,
        component: (<div
          className="PatchGroup PatchGroup--installing library"
        >
          <span className="name">{owner}/{name}</span>
          <span className="version">{version}</span>
          <Icon name="circle-o-notch" spin />
        </div>),
      }),
      installingLibs
    );
    const installingLibNames = R.pluck('name', installingLibsComponents);

    const libComponents = R.compose(
      R.reject(R.compose(
        isAmong(installingLibNames),
        R.prop('name')
      )),
      R.map(([libName, libPatches]) => ({
        name: libName,
        component: (<PatchGroup
          key={libName}
          type="library"
          name={libName}
          onClose={this.deselectIfInLibrary(libName)}
        >
          {libPatches.map(({ path, dead }) =>
            <PatchGroupItem
              key={path}
              patchPath={path}
              dead={dead}
              label={getBaseName(path)}
              isSelected={path === selectedPatchPath}
              onClick={() => setSelection(path)}
              onDoubleClick={() => switchPatch(path)}
              onBeginDrag={startDraggingPatch}
              hoverButtons={this.libraryPatchesHoveredButtons(path)}
            />
          )}
        </PatchGroup>),
      })),
      R.toPairs
    )(libs);

    return R.compose(
      R.map(R.prop('component')),
      R.sortBy(R.prop('name')),
      R.concat
    )(libComponents, installingLibsComponents);
  }

  renderPatches(patchType) {
    const rendererKeys = patchType === PATCH_TYPE.ALL
      ? [PATCH_TYPE.MY, PATCH_TYPE.LIBRARY]
      : R.of(patchType);

    return (
      // "calc(100% - 30px)" cause patch filtering buttons are 30px height
      <CustomScroll heightRelativeToParent="calc(100% - 30px)">
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
          popups={this.props.popups}
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
  projectName: PropTypes.string.isRequired,
  currentPatchPath: PropTypes.string,
  selectedPatchPath: PropTypes.string,
  selectedPatchLabel: PropTypes.string.isRequired,
  localPatches: sanctuaryPropType($.Array(Patch)),
  popups: PropTypes.object.isRequired,
  libs: sanctuaryPropType($.StrMap($.Array(Patch))),
  installingLibs: PropTypes.array,
  defaultNodePosition: PropTypes.object.isRequired,
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
    renameProject: PropTypes.func.isRequired,
    closeAllPopups: PropTypes.func.isRequired,
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
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
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
    renameProject: ProjectActions.renameProject,

    closeAllPopups: PopupActions.hideAllPopups,

    addNotification: MessagesActions.addNotification,
  }, dispatch),
});


export default connect(mapStateToProps, mapDispatchToProps)(ProjectBrowser);
