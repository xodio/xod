import R from 'ramda';
import PropTypes from 'prop-types';
import $ from 'sanctuary-def';
import React from 'react';
import { Patch } from 'xod-project';
import { $Maybe } from 'xod-func-tools';

import { SELECTION_ENTITY_TYPE } from '../constants';

import NodeInspector from './NodeInspector';
import PatchInspector from './PatchInspector';
import Widgets from './inspectorWidgets';
import { noop, isMany, isOne } from '../../utils/ramda';

import { RenderableSelection } from '../../project/types';
import sanctuaryPropType from '../../utils/sanctuaryPropType';


const InspectorMessage = ({ text }) => (
  <div className="Inspector">
    <Widgets.HintWidget
      text={text}
    />
  </div>
);

InspectorMessage.propTypes = {
  text: PropTypes.string.isRequired,
};


// :: [ RenderableSelection ] -> Boolean
const isEntity = entity => R.compose(R.equals(entity), R.prop('entityType'), R.head);
const isSingleNode = R.both(isOne, isEntity(SELECTION_ENTITY_TYPE.NODE));
const isSingleLink = R.both(isOne, isEntity(SELECTION_ENTITY_TYPE.LINK));
const isSingleComment = R.both(isOne, isEntity(SELECTION_ENTITY_TYPE.COMMENT));
// :: [ RenderableSelection ] -> Patch -> Boolean
const isPatchSelected = (selection, patch) => (
  (R.isEmpty(selection) && patch.isJust)
);

const Inspector = ({
  selection,
  currentPatch,
  onPropUpdate,
  onPatchDescriptionUpdate,
}) => {
  if (isMany(selection)) {
    return (
      <InspectorMessage
        text={`You have selected: ${selection.length} elements.`}
      />
    );
  } else if (isSingleLink(selection)) {
    return (
      <InspectorMessage
        text="Links do not have any properties."
      />
    );
  } else if (isSingleComment(selection)) {
    return (
      <InspectorMessage
        text="Comments do not have any properties."
      />
    );
  } else if (isSingleNode(selection)) {
    return (
      <NodeInspector
        node={selection[0].data}
        onPropUpdate={onPropUpdate}
      />
    );
  } else if (isPatchSelected(selection, currentPatch)) {
    return (
      <PatchInspector
        patch={currentPatch.getOrElse(null)}
        onDescriptionUpdate={onPatchDescriptionUpdate}
      />
    );
  }

  return (
    <InspectorMessage
      text="Open a patch to edit its properties"
    />
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
