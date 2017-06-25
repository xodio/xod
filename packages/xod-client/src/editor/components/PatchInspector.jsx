import React from 'react';
import PropTypes from 'prop-types';
import * as XP from 'xod-project';

import { noop } from '../../utils/ramda';
import DescriptionWidget from './inspectorWidgets/DescriptionWidget';
import sanctuaryPropType from '../../utils/sanctuaryPropType';

class PatchInspector extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: XP.getPatchDescription(props.patch),
    };

    this.updateValue = this.updateValue.bind(this);
    this.commitUpdate = this.commitUpdate.bind(this);
  }

  updateValue(value) {
    this.setState({ value });
  }
  commitUpdate() {
    if (this.state.value === XP.getPatchDescription(this.props.patch)) {
      return;
    }

    const patchPath = XP.getPatchPath(this.props.patch);
    this.props.onDescriptionUpdate(this.state.value, patchPath);
  }

  render() {
    const patchPath = XP.getPatchPath(this.props.patch);
    const disabled = XP.isPathLibrary(patchPath);
    const baseName = XP.getBaseName(patchPath);

    return (
      <div className="Inspector">
        <div className="inspectorTitle">Patch: <span className="patchName">{baseName}</span></div>

        <DescriptionWidget
          elementId="patchDescription_textarea"
          value={this.state.value}
          disabled={disabled}
          onBlur={this.commitUpdate}
          onChange={this.updateValue}
          onKeyDown={noop}
        />
      </div>
    );
  }
}

PatchInspector.propTypes = {
  patch: sanctuaryPropType(XP.Patch),
  onDescriptionUpdate: PropTypes.func.isRequired,
};

export default PatchInspector;
