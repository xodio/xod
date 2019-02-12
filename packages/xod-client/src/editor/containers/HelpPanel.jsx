import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import {
  Patch as PatchType,
  NOT_IMPLEMENTED_IN_XOD_PATH,
  TABTEST_MARKER_PATH,
} from 'xod-project';
import { $Maybe, foldMaybe, explodeMaybe } from 'xod-func-tools';

import { PANEL_IDS, SIDEBAR_IDS } from '../constants';

import SidebarPanel from '../components/SidebarPanel';
import { getPatchOfSelectedNodeForQuickHelp } from '../../core/selectors';
import PatchDocs from '../components/PatchDocs';
import CppPatchDocs from '../components/CppPatchDocs';
import TabtestPatchDocs from '../components/TabtestPatchDocs';
import sanctuaryPropType from '../../utils/sanctuaryPropType';
import { getEditingAttachmentPatchPath } from '../selectors';
import { getCurrentPatch } from '../../project/selectors';

const getDocsForSelectedNode = foldMaybe(
  <div className="no-selection">
    Select a node or patch to view its documentation article
  </div>,
  patch => <PatchDocs patch={patch} minimal />
);

const getDocsForCpp = R.compose(
  patch => <CppPatchDocs patch={patch} />,
  explodeMaybe('Imposible error')
);

const getDocsForTabtest = R.compose(
  patch => <TabtestPatchDocs patch={patch} />,
  explodeMaybe('Imposible error')
);

const HelpPanel = ({
  maybeSelectedPatch,
  maybeCurrentPatch,
  editingAttachmentPatchPath,
  sidebarId,
  autohide,
}) => {
  const content = (attachmentPatchPath => {
    switch (attachmentPatchPath) {
      case NOT_IMPLEMENTED_IN_XOD_PATH:
        return getDocsForCpp(maybeCurrentPatch);
      case TABTEST_MARKER_PATH:
        return getDocsForTabtest(maybeCurrentPatch);
      default:
        return getDocsForSelectedNode(maybeSelectedPatch);
    }
  })(editingAttachmentPatchPath);

  return (
    <SidebarPanel
      id={PANEL_IDS.HELPBAR}
      className="HelpPanel"
      title="Quick Help"
      sidebarId={sidebarId}
      autohide={autohide}
    >
      <div className="HelpPanel-content">{content}</div>
    </SidebarPanel>
  );
};

HelpPanel.propTypes = {
  sidebarId: PropTypes.oneOf(R.values(SIDEBAR_IDS)).isRequired,
  autohide: PropTypes.bool.isRequired,
  maybeCurrentPatch: sanctuaryPropType($Maybe(PatchType)),
  maybeSelectedPatch: sanctuaryPropType($Maybe(PatchType)),
  editingAttachmentPatchPath: PropTypes.string,
};

const mapStateToProps = R.applySpec({
  maybeSelectedPatch: getPatchOfSelectedNodeForQuickHelp,
  maybeCurrentPatch: getCurrentPatch,
  editingAttachmentPatchPath: getEditingAttachmentPatchPath,
});

export default connect(mapStateToProps)(HelpPanel);
