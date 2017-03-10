import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { HotKeys } from 'react-hotkeys';
import core from 'xod-core';

import * as ProjectActions from '../../project/actions';
import * as ProjectBrowserActions from '../../projectBrowser/actions';
import * as EditorActions from '../../editor/actions';
import * as EditorSelectors from '../../editor/selectors';
import * as ProjectBrowserSelectors from '../selectors';
import { COMMAND } from '../../utils/constants';

import ProjectBrowserToolbar from '../components/ProjectBrowserPopups';

class ProjectBrowser extends React.Component {
  constructor(props) {
    super(props);

    this.onRename = this.onRename.bind(this);
    this.onDelete = this.onDelete.bind(this);
    this.onPatchCreate = this.onPatchCreate.bind(this);
    this.onToolbarHotkeys = this.onToolbarHotkeys.bind(this);

    this.getHotkeyHandlers = this.getHotkeyHandlers.bind(this);

    this.hotkeys = {};
  }

  componentDidMount() {
    this.setHotkeys(this.getHotkeyHandlers());
  }

  onPatchCreate(name) {
    this.props.actions.addPatch(name, null);
  }

  onDelete(type, id) {
    this.props.actions.deletePatch(id);
  }

  onRename(type, id, name) {
    if (id) {
      this.props.actions.renamePatch(id, name);
    } else {
      this.props.actions.renameProject(name);
    }
  }

  onToolbarHotkeys(hotkeys) {
    this.hotkeys = hotkeys;
  }

  setHotkeys(hotkeys) {
    this.hotkeys = hotkeys;
  }

  getHotkeyHandlers() {
    return R.merge(
      {
        [COMMAND.ESCAPE]: () => this.props.actions.setSelection(null),
      },
      this.hotkeys
    );
  }

  render() {
    return (
      <HotKeys
        handlers={this.getHotkeyHandlers()}
        className="ProjectBrowser"
      >
        <ProjectBrowserToolbar
          hotkeys={this.onToolbarHotkeys}
          selection={this.props.selection}
          openPopups={this.props.openPopups}
          patches={this.props.patches}
          onDelete={this.onDelete}
          onRename={this.onRename}
          onPatchCreate={this.onPatchCreate}
          onPatchCreateClick={this.props.actions.onPatchCreateClick}
          onRenameClick={this.props.actions.onRenameClick}
          onDeleteClick={this.props.actions.onDeleteClick}
          closeAllPopups={this.props.actions.closeAllPopups}
        />
      </HotKeys>
    );
  }
}

ProjectBrowser.propTypes = {
  actions: React.PropTypes.object,
  selection: React.PropTypes.object,
  patches: React.PropTypes.object,
  openPopups: React.PropTypes.objectOf(React.PropTypes.bool).isRequired,
};

const mapStateToProps = (state) => {
  const curPatchId = EditorSelectors.getCurrentPatchId(state);

  const selection = {
    type: 'patch',
    id: ProjectBrowserSelectors.getSelectedPatchId(state),
  };

  return {
    selection,
    patches: core.getPatches(state),
    currentPatchId: curPatchId,
    openPopups: state.projectBrowser.openPopups,
  };
};

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    switchPatch: EditorActions.switchPatch,
    addPatch: ProjectActions.addPatch,
    renamePatch: ProjectActions.renamePatch,
    deletePatch: ProjectActions.deletePatch,
    renameProject: ProjectActions.renameProject,
    setSelection: ProjectBrowserActions.setSelection,
    onPatchCreateClick: ProjectBrowserActions.requestCreatePatch,
    onRenameClick: ProjectBrowserActions.requestRenamePatch,
    onDeleteClick: ProjectBrowserActions.requestDeletePatch,
    closeAllPopups: ProjectBrowserActions.cancelPopup,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(ProjectBrowser);
