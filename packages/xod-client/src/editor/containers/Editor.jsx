import R from 'ramda';
import React from 'react';
import $ from 'sanctuary-def';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { HotKeys } from 'react-hotkeys';

import * as Actions from '../actions';
import * as ProjectActions from '../../project/actions';
import * as ProjectSelectors from '../../project/selectors';
import * as EditorSelectors from '../selectors';

import { COMMAND } from '../../utils/constants';
import { EDITOR_MODE } from '../../editor/constants';

import Patch from './Patch';
import NoPatch from '../components/NoPatch';
import ProjectBrowser from '../../projectBrowser/containers/ProjectBrowser';
import Sidebar from '../../utils/components/Sidebar';
import Workarea from '../../utils/components/Workarea';

import { RenderableSelection } from '../../project/types';
import sanctuaryPropType from '../../utils/sanctuaryPropType';

import Tabs from '../containers/Tabs';
import Inspector from '../components/Inspector';

class Editor extends React.Component {
  constructor(props) {
    super(props);

    this.setModeCreating = this.setModeCreating.bind(this);
    this.setModeDefault = this.setModeDefault.bind(this);
    this.getHotkeyHandlers = this.getHotkeyHandlers.bind(this);

    this.patchSize = this.props.size;
  }

  setModeCreating() {
    this.props.actions.setMode(EDITOR_MODE.CREATING_NODE);
  }

  setModeDefault() {
    this.props.actions.setMode(EDITOR_MODE.DEFAULT);
  }

  getHotkeyHandlers() {
    return {
      [COMMAND.SET_MODE_DEFAULT]: this.setModeDefault,
      [COMMAND.UNDO]: () => this.props.actions.undo(this.props.currentPatchPath),
      [COMMAND.REDO]: () => this.props.actions.redo(this.props.currentPatchPath),
    };
  }

  render() {
    const {
      currentPatchPath,
      selection,
    } = this.props;

    const currentPatch = currentPatchPath
      ? (
        <Patch
          patchPath={currentPatchPath}
          size={this.patchSize}
          setModeCreating={this.setModeCreating}
        />
      ) : (
        <NoPatch />
      );

    return (
      <HotKeys handlers={this.getHotkeyHandlers()} className="Editor">
        <Sidebar>
          <ProjectBrowser />
          <Inspector
            selection={selection}
            onPropUpdate={this.props.actions.updateNodeProperty}
          />
        </Sidebar>
        <Workarea>
          <Tabs />
          {currentPatch}
        </Workarea>
      </HotKeys>
    );
  }
}

Editor.propTypes = {
  size: React.PropTypes.object.isRequired,
  selection: sanctuaryPropType($.Array(RenderableSelection)),
  currentPatchPath: React.PropTypes.string,
  actions: React.PropTypes.shape({
    updateNodeProperty: React.PropTypes.func.isRequired,
    undo: React.PropTypes.func.isRequired,
    redo: React.PropTypes.func.isRequired,
    setMode: React.PropTypes.func.isRequired,
  }),
};

const mapStateToProps = R.applySpec({
  selection: ProjectSelectors.getRenderableSelection,
  currentPatchPath: EditorSelectors.getCurrentPatchPath,
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    updateNodeProperty: ProjectActions.updateNodeProperty,
    undo: ProjectActions.undoPatch,
    redo: ProjectActions.redoPatch,
    setMode: Actions.setMode,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Editor);
