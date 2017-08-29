import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import $ from 'sanctuary-def';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { HotKeys, FocusTrap } from 'react-hotkeys';
import { Patch as PatchType } from 'xod-project';
import { $Maybe } from 'xod-func-tools';

import * as Actions from '../actions';
import * as ProjectActions from '../../project/actions';
import * as ProjectSelectors from '../../project/selectors';
import * as EditorSelectors from '../selectors';

import { COMMAND } from '../../utils/constants';
import { EDITOR_MODE, FOCUS_AREAS } from '../constants';

import Patch from './Patch';
import NoPatch from '../components/NoPatch';
import ProjectBrowser from '../../projectBrowser/containers/ProjectBrowser';
import Sidebar from '../../utils/components/Sidebar';
import Workarea from '../../utils/components/Workarea';

import { RenderableSelection } from '../../project/types';
import sanctuaryPropType from '../../utils/sanctuaryPropType';

import { isInput } from '../../utils/browser';

import Tabs from '../containers/Tabs';
import Helpbar from '../containers/Helpbar';
import Inspector from '../components/Inspector';

class Editor extends React.Component {
  constructor(props) {
    super(props);

    this.setModeDefault = this.setModeDefault.bind(this);
    this.getHotkeyHandlers = this.getHotkeyHandlers.bind(this);
    this.toggleHelpbar = this.toggleHelpbar.bind(this);

    this.patchSize = this.props.size;
  }

  setModeDefault() {
    this.props.actions.setMode(EDITOR_MODE.DEFAULT);
  }

  getHotkeyHandlers() {
    return {
      [COMMAND.SET_MODE_DEFAULT]: this.setModeDefault,
      [COMMAND.UNDO]: () => this.props.actions.undo(this.props.currentPatchPath),
      [COMMAND.REDO]: () => this.props.actions.redo(this.props.currentPatchPath),
      [COMMAND.TOGGLE_HELPBAR]: this.toggleHelpbar,
    };
  }

  toggleHelpbar(e) {
    if (isInput(e)) return;

    this.props.actions.toggleHelpbar();
  }

  render() {
    const {
      currentPatchPath,
      currentPatch,
      selection,
    } = this.props;

    const openedPatch = currentPatchPath
      ? (
        <Patch
          patchPath={currentPatchPath}
          size={this.patchSize}
        />
      ) : (
        <NoPatch />
      );

    return (
      <HotKeys handlers={this.getHotkeyHandlers()} className="Editor">
        <Sidebar>
          <FocusTrap onFocus={() => this.props.actions.setFocusedArea(FOCUS_AREAS.PROJECT_BROWSER)}>
            <ProjectBrowser />
          </FocusTrap>
          <FocusTrap onFocus={() => this.props.actions.setFocusedArea(FOCUS_AREAS.INSPECTOR)}>
            <Inspector
              selection={selection}
              currentPatch={currentPatch}
              onPropUpdate={this.props.actions.updateNodeProperty}
              onPatchDescriptionUpdate={this.props.actions.updatePatchDescription}
            />
          </FocusTrap>
        </Sidebar>
        <FocusTrap onFocus={() => this.props.actions.setFocusedArea(FOCUS_AREAS.WORKAREA)}>
          <Workarea>
            <Tabs />
            {openedPatch}
          </Workarea>
        </FocusTrap>
        <Helpbar />
      </HotKeys>
    );
  }
}

Editor.propTypes = {
  size: PropTypes.object.isRequired,
  selection: sanctuaryPropType($.Array(RenderableSelection)),
  currentPatchPath: PropTypes.string,
  currentPatch: sanctuaryPropType($Maybe(PatchType)),
  actions: PropTypes.shape({
    updateNodeProperty: PropTypes.func.isRequired,
    updatePatchDescription: PropTypes.func.isRequired,
    undo: PropTypes.func.isRequired,
    redo: PropTypes.func.isRequired,
    setMode: PropTypes.func.isRequired,
    toggleHelpbar: PropTypes.func.isRequired,
    setFocusedArea: PropTypes.func.isRequired,
  }),
};

const mapStateToProps = R.applySpec({
  selection: ProjectSelectors.getRenderableSelection,
  currentPatch: ProjectSelectors.getCurrentPatch,
  currentPatchPath: EditorSelectors.getCurrentPatchPath,
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    updateNodeProperty: ProjectActions.updateNodeProperty,
    updatePatchDescription: ProjectActions.updatePatchDescription,
    undo: ProjectActions.undoPatch,
    redo: ProjectActions.redoPatch,
    setMode: Actions.setMode,
    toggleHelpbar: Actions.toggleHelpbar,
    setFocusedArea: Actions.setFocusedArea,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Editor);
