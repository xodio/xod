import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Patch as PatchType } from 'xod-project';
import { $Maybe } from 'xod-func-tools';

import { PANEL_IDS, SIDEBAR_IDS } from '../constants';

import SidebarPanel from '../components/SidebarPanel';
import { getPatchForQuickHelp } from '../../core/selectors';
import PatchDocs from '../components/PatchDocs';
import sanctuaryPropType from '../../utils/sanctuaryPropType';

const HelpPanel = ({ maybeSelectedPatch, sidebarId, autohide }) => {
  const docs = maybeSelectedPatch
    .map(patch => <PatchDocs patch={patch} minimal />)
    .getOrElse(
      <div className="no-selection">
        Select a node or patch to view its documentation article
      </div>
    );

  return (
    <SidebarPanel
      id={PANEL_IDS.HELPBAR}
      className="HelpPanel"
      title="Quick Help"
      sidebarId={sidebarId}
      autohide={autohide}
    >
      <div className="HelpPanel-content">{docs}</div>
    </SidebarPanel>
  );
};

HelpPanel.propTypes = {
  sidebarId: PropTypes.oneOf(R.values(SIDEBAR_IDS)).isRequired,
  autohide: PropTypes.bool.isRequired,
  maybeSelectedPatch: sanctuaryPropType($Maybe(PatchType)),
};

const mapStateToProps = R.applySpec({
  maybeSelectedPatch: getPatchForQuickHelp,
});

export default connect(mapStateToProps)(HelpPanel);
