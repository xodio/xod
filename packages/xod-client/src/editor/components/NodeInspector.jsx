import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import * as XP from 'xod-project';

import {
  SELECTION_ENTITY_TYPE,
  WIDGET_TYPE,
} from '../constants';
import { NODE_PROPERTY_KIND, NODE_PROPERTY_KEY } from '../../project/constants';

import WidgetsGroup from './WidgetsGroup';
import Widgets, { WIDGET_MAPPING } from './inspectorWidgets';

import { RenderableNode } from '../../types';
import sanctuaryPropType from '../../utils/sanctuaryPropType';
import { getUtmSiteUrl } from '../../utils/urls';

import * as MESSAGES from '../messages';

// :: RenderablePin -> String
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
  keyName: XP.getPinKey,
  type: XP.getPinType,
  label: XP.getPinLabel,
  normalizedLabel: R.prop('normalizedLabel'),
  value: R.prop('value'),
  direction: XP.getPinDirection,
  isConnected: R.prop('isConnected'),
  isBindable: XP.isPinBindable,
  isLastVariadicGroup: R.prop('isLastVariadicGroup'),
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
  R.apply(R.concat),
  R.map(R.sort(R.ascend(XP.getPinOrder))),
  R.juxt([
    R.filter(XP.isInputPin),
    R.filter(XP.isOutputPin),
  ]),
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
  const nodeHelpIcon = (XP.isPathBuiltIn(type) || XP.isPathLocal(type))
    ? null
    : (
      <a
        href={getUtmSiteUrl(`/libs/${type}`, 'docs', 'inspector')}
        target="_blank"
        rel="noopener noreferrer"
        className="nodeHelp"
        title="Open documentation in web browser"
      >
        <span className="nodeHelpIcon" />
      </a>
    );

  const baseName = XP.getBaseName(type);

  const nodeId = XP.getNodeId(node);

  const DeadNodeMessage = (node.dead) ? (
    <Widgets.HintWidget text={MESSAGES.PATCH_FOR_NODE_IS_MISSING} />
  ) : null;

  return (
    <div className="Inspector-content">
      {nodeHelpIcon}

      <div className="inspectorTitle">
        <span className="nodeName">{baseName}</span>
      </div>

      <div className="nodeType">{type}</div>

      <NodeLabelWidget
        entityId={nodeId}
        key={`node_label_${nodeId}`}
        kind={NODE_PROPERTY_KIND.PROP}
        keyName={NODE_PROPERTY_KEY.LABEL}
        label="Label"
        title="Node’s label"
        value={XP.getNodeLabel(node)}
        onPropUpdate={onPropUpdate}
      />

      {DeadNodeMessage}

      <WidgetsGroup
        entity={node}
        createWidgetsConfig={createPinWidgetsConfig}
        onPropUpdate={onPropUpdate}
      />

      <NodeDescriptionWidget
        entityId={nodeId}
        key={`node_description_${nodeId}`}
        kind={NODE_PROPERTY_KIND.PROP}
        keyName={NODE_PROPERTY_KEY.DESCRIPTION}
        label="Description"
        value={XP.getNodeDescription(node)}
        onPropUpdate={onPropUpdate}
      />
    </div>
  );
};

NodeInspector.propTypes = {
  node: sanctuaryPropType(RenderableNode),
  onPropUpdate: PropTypes.func.isRequired,
};

export default NodeInspector;
