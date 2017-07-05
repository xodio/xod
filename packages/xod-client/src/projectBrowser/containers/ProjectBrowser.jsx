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

import { getUtmSiteUrl } from '../../utils/siteLinks';
import { IconGuide } from '../../utils/components/IconGuide';

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
    this.props.actions.addNode(
      patchPath,
      { x: 50, y: 50 },
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
        className="hover-button"
        onClick={() => requestDelete(patchPath)}
      />,
      <Icon
        key="rename"
        name="pencil"
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

    const classNames = cn('hover-button', { disabled: !canAdd });
    const action = canAdd ? () => this.onAddNode(patchPath) : noop;

    return (
      <Icon
        key="add"
        name="plus-circle"
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
    } = this.props.actions;

    const renderItem = ({ path }) => (
      <PatchGroupItem
        key={path}
        label={getBaseName(path)}
        isOpen={path === currentPatchPath}
        onDoubleClick={() => switchPatch(path)}
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
    const { libs, selectedPatchPath } = this.props;
    const { setSelection, switchPatch } = this.props.actions;

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
            onDoubleClick={() => switchPatch(path)}
            hoverButtons={this.libraryPatchesHoveredButtons(path)}
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
});

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
