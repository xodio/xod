import R from 'ramda';
import PropTypes from 'prop-types';
import $ from 'sanctuary-def';
import React from 'react';
import { Patch } from 'xod-project';
import { $Maybe } from 'xod-func-tools';
import CustomScroll from 'react-custom-scroll';

import { SELECTION_ENTITY_TYPE } from '../constants';

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
  <div className="Inspector">
    <Widgets.HintWidget text={text} />
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
  <InspectorMessage text={`You have selected: ${selection.length} elements.`} />
);

const renderSelectedLink = () => (
  <InspectorMessage text="Links do not have any properties." />
);

const renderSelectedComment = () => (
  <InspectorMessage text="Comments do not have any properties." />
);
const renderSelectedNode = R.curry((onPropUpdate, selection) => (
  <NodeInspector node={selection[0].data} onPropUpdate={onPropUpdate} />
));
const renderSelectedPatch = R.curry(
  (currentPatch, onPatchDescriptionUpdate) => (
    <PatchInspector
      patch={currentPatch.getOrElse(null)}
      onDescriptionUpdate={onPatchDescriptionUpdate}
    />
  )
);
const renderDefault = () => (
  <InspectorMessage text="Open a patch to edit its properties" />
);

// =============================================================================
//
// Utils
//
// =============================================================================

// :: [ RenderableSelection ] -> Boolean
const isEntity = entity =>
  R.compose(R.equals(entity), R.prop('entityType'), R.head);
const isSingleNode = R.both(isOne, isEntity(SELECTION_ENTITY_TYPE.NODE));
const isSingleLink = R.both(isOne, isEntity(SELECTION_ENTITY_TYPE.LINK));
const isSingleComment = R.both(isOne, isEntity(SELECTION_ENTITY_TYPE.COMMENT));
// :: [ RenderableSelection ] -> Patch -> Boolean
const isPatchSelected = R.curry(
  (patch, selection) => R.isEmpty(selection) && patch.isJust
);

// =============================================================================
//
// Main component
//
// =============================================================================

const Inspector = ({
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
    <CustomScroll heightRelativeToParent="100%">
      {inspectorContent}
    </CustomScroll>
  );
};

Inspector.propTypes = {
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
