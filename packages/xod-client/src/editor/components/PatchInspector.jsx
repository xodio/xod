import React from 'react';
import PropTypes from 'prop-types';
import * as XP from 'xod-project';

import { WIDGET_TYPE } from '../constants';
import Widgets, { getNodeWidgetConfig } from './inspectorWidgets';

import sanctuaryPropType from '../../utils/sanctuaryPropType';

const PatchDescriptionWidget = Widgets.composeWidget(
  Widgets.DescriptionWidget,
  getNodeWidgetConfig(WIDGET_TYPE.TEXTAREA).props
);

class PatchInspector extends React.PureComponent {
  constructor(props) {
    super(props);

    this.onDescriptionUpdate = this.onDescriptionUpdate.bind(this);
  }

  onDescriptionUpdate(patchPath, kind, keyName, value) {
    this.props.onDescriptionUpdate(value, patchPath);
  }

  render() {
    const patchPath = XP.getPatchPath(this.props.patch);
    const disabled = XP.isPathLibrary(patchPath);
    const baseName = XP.getBaseName(patchPath);

    return (
      <div className="Inspector-content">
        <div className="inspectorTitle">
          <span className="patchName">{baseName}</span>
        </div>

        <PatchDescriptionWidget
          key={patchPath}
          entityId={patchPath}
          keyName=""
          label="Description"
          disabled={disabled}
          value={XP.getPatchDescription(this.props.patch)}
          onPropUpdate={this.onDescriptionUpdate}
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
