import R from 'ramda';
import React from 'react';
import XP from 'xod-project';

import { SELECTION_ENTITY_TYPE, WIDGET_TYPE } from '../constants';
import { NODE_PROPERTY_KIND, NODE_PROPERTY_KEY } from '../../project/constants';

import WidgetsGroup from './WidgetsGroup';
import Widgets, { WIDGET_MAPPING } from './inspectorWidgets';

import { RenderableNode } from '../../project/types';
import sanctuaryPropType from '../../utils/sanctuaryPropType';

// :: entityId -> propKey -> string
const getWidgetKey = R.converge(
  (id, key) => `${id}_${key}`,
  [
    R.prop('nodeId'),
    R.prop('key'),
  ]
);

const getPinWidgetProps = R.applySpec({
  entityId: R.prop('nodeId'),
  kind: R.always(NODE_PROPERTY_KIND.PIN),
  key: getWidgetKey,
  keyName: R.prop('key'),
  type: R.prop('type'),
  label: R.prop('label'),
  value: R.prop('value'),
  injected: R.complement(R.prop('isConnected')),
});

// :: RenderableNode -> { components: {...}, props: {...} }
const createPinWidgetsConfig = R.compose(
  R.reduce(
    (acc, renderablePin) => {
      const widgetProps = getPinWidgetProps(renderablePin);

      const widget = Widgets.composeWidget(
        WIDGET_MAPPING[SELECTION_ENTITY_TYPE.NODE][widgetProps.type].component,
        WIDGET_MAPPING[SELECTION_ENTITY_TYPE.NODE][widgetProps.type].props
      );

      return R.compose(
        R.assocPath(['components', widgetProps.key], widget),
        R.assocPath(['props', widgetProps.key], widgetProps)
      )(acc);
    },
    { components: {}, props: {} }
  ),
  R.sortBy(XP.getPinOrder),
  R.reject(XP.isOutputPin),
  R.values,
  R.prop('pins')
);

const NodeLabelWidget = Widgets.composeWidget(
  Widgets.LabelWidget,
  WIDGET_MAPPING[SELECTION_ENTITY_TYPE.NODE][WIDGET_TYPE.STRING].props
);

const NodeDescriptionWidget = Widgets.composeWidget(
  Widgets.DescriptionWidget,
  WIDGET_MAPPING[SELECTION_ENTITY_TYPE.NODE][WIDGET_TYPE.TEXTAREA].props
);

const NodeInspector = ({ node, onPropUpdate }) => {
  const type = XP.getNodeType(node);
  const baseName = XP.getBaseName(type);

  const nodeId = XP.getNodeId(node);

  return (
    <div className="Inspector">
      <div className="inspectorTitle">Node: <span className="nodeName">{baseName}</span></div>

      <a
        href={`https://xod.io/TODOREPLACEME/${type}`}
        target="_blank"
        rel="noopener noreferrer"
        className="nodeHelp"
      >
        <span className="nodeHelpIcon" />
      </a>

      <div className="nodeType">{type}</div>

      <NodeLabelWidget
        entityId={nodeId}
        key={nodeId}
        kind={NODE_PROPERTY_KIND.PROP}
        injected={false}
        keyName={NODE_PROPERTY_KEY.LABEL}
        label="Label"
        value={XP.getNodeLabel(node)}
        onPropUpdate={onPropUpdate}
      />

      <WidgetsGroup
        entity={node}
        createWidgetsConfig={createPinWidgetsConfig}
        onPropUpdate={onPropUpdate}
      />

      <NodeDescriptionWidget
        entityId={nodeId}
        key={nodeId}
        kind={NODE_PROPERTY_KIND.PROP}
        injected={false}
        keyName={NODE_PROPERTY_KEY.TEXTAREA}
        label="Description"
        value={XP.getNodeDescription(node)}
        onPropUpdate={onPropUpdate}
      />
    </div>
  );
};

NodeInspector.propTypes = {
  node: sanctuaryPropType(RenderableNode),
  onPropUpdate: React.PropTypes.func.isRequired,
};

export default NodeInspector;
