import * as R from 'ramda';
import PropTypes from 'prop-types';
import $ from 'sanctuary-def';
import React from 'react';
import { Patch } from 'xod-project';
import { $Maybe } from 'xod-func-tools';

import {
  SELECTION_ENTITY_TYPE,
  PANEL_IDS,
  SIDEBAR_IDS,
} from '../constants';

import SidebarPanel from '../components/SidebarPanel';
import NodeInspector from './NodeInspector';
import PatchInspector from './PatchInspector';
import Widgets from './inspectorWidgets';
import { noop, isMany, isOne } from '../../utils/ramda';

import { RenderableSelection } from '../../types';
import sanctuaryPropType from '../../utils/sanctuaryPropType';


// =============================================================================
//
// Sub-components
//
// =============================================================================

const InspectorMessage = ({ text }) => (
  <div className="Inspector-content">
    <Widgets.HintWidget
      text={text}
    />
  </div>
);

InspectorMessage.propTypes = {
  text: PropTypes.string.isRequired,
};

// =============================================================================
//
// Rendering functions
//
// =============================================================================
const renderSelectedManyElements = selection => (
  <InspectorMessage
    text={`You have selected: ${selection.length} elements.`}
  />
);

const renderSelectedLink = () => (
  <InspectorMessage
    text="Links do not have any properties."
  />
);

const renderSelectedComment = () => (
  <InspectorMessage
    text="Comments do not have any properties."
  />
);
const renderSelectedNode = R.curry(
  (onPropUpdate, selection) => (
    <NodeInspector
      node={selection[0].data}
      onPropUpdate={onPropUpdate}
    />
  )
);
const renderSelectedPatch = R.curry(
  (currentPatch, onPatchDescriptionUpdate) => (
    <PatchInspector
      patch={currentPatch.getOrElse(null)}
      onDescriptionUpdate={onPatchDescriptionUpdate}
    />
  )
);
const renderDefault = () => (
  <InspectorMessage
    text="Open a patch to edit its properties"
  />
);

// =============================================================================
//
// Utils
//
// =============================================================================

// :: [ RenderableSelection ] -> Boolean
const isEntity = entity => R.compose(R.equals(entity), R.prop('entityType'), R.head);
const isSingleNode = R.both(isOne, isEntity(SELECTION_ENTITY_TYPE.NODE));
const isSingleLink = R.both(isOne, isEntity(SELECTION_ENTITY_TYPE.LINK));
const isSingleComment = R.both(isOne, isEntity(SELECTION_ENTITY_TYPE.COMMENT));
// :: [ RenderableSelection ] -> Patch -> Boolean
const isPatchSelected = R.curry((patch, selection) => (
  (R.isEmpty(selection) && patch.isJust)
));

// =============================================================================
//
// Main component
//
// =============================================================================

const Inspector = ({
  sidebarId,
  autohide,
  selection,
  currentPatch,
  onPropUpdate,
  onPatchDescriptionUpdate,
}) => {
  const inspectorContent = R.cond([
    [isMany, renderSelectedManyElements],
    [isSingleLink, renderSelectedLink],
    [isSingleComment, renderSelectedComment],
    [isSingleNode, renderSelectedNode(onPropUpdate)],
    [
      isPatchSelected(currentPatch),
      () => renderSelectedPatch(currentPatch, onPatchDescriptionUpdate),
    ],
    [R.T, renderDefault],
  ])(selection);

  return (
    <SidebarPanel
      id={PANEL_IDS.INSPECTOR}
      className="Inspector"
      title="Inspector"
      sidebarId={sidebarId}
      autohide={autohide}
    >
      {inspectorContent}
    </SidebarPanel>
  );
};

Inspector.propTypes = {
  sidebarId: PropTypes.oneOf(R.values(SIDEBAR_IDS)).isRequired,
  autohide: PropTypes.bool.isRequired,
  selection: sanctuaryPropType($.Array(RenderableSelection)),
  currentPatch: sanctuaryPropType($Maybe(Patch)),
  onPropUpdate: PropTypes.func.isRequired,
  onPatchDescriptionUpdate: PropTypes.func.isRequired,
};

Inspector.defaultProps = {
  selection: [],
  onPropUpdate: noop,
  onPatchDescriptionUpdate: noop,
};

export default Inspector;
