import R from 'ramda';
import $ from 'sanctuary-def';
import React from 'react';

import { SELECTION_ENTITY_TYPE } from '../constants';

import NodeInspector from './NodeInspector';
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
  text: React.PropTypes.string.isRequired,
};


// :: [ RenderableSelection ] -> Boolean
const isEntity = entity => R.compose(R.equals(entity), R.prop('entityType'), R.head);
const isSingleNode = R.both(isOne, isEntity(SELECTION_ENTITY_TYPE.NODE));
const isSingleLink = R.both(isOne, isEntity(SELECTION_ENTITY_TYPE.LINK));

const Inspector = ({
  selection,
  onPropUpdate,
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
        text="Links do not any properties."
      />
    );
  } else if (isSingleNode(selection)) {
    return (
      <NodeInspector
        node={selection[0].data}
        onPropUpdate={onPropUpdate}
      />
    );
  }

  return (
    <InspectorMessage
      text="Select a node to edit its properties."
    />
  );
};

Inspector.propTypes = {
  selection: sanctuaryPropType($.Array(RenderableSelection)),
  onPropUpdate: React.PropTypes.func.isRequired,
};

Inspector.defaultProps = {
  selection: [],
  onPropUpdate: noop,
};

export default Inspector;
