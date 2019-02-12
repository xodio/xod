import React from 'react';
import PropTypes from 'prop-types';
import * as XP from 'xod-project';

import { WIDGET_TYPE } from '../constants';
import { NODE_PROPERTY_KIND, NODE_PROPERTY_KEY } from '../../project/constants';

import PinWidgetsGroup from './PinWidgetsGroup';
import {
  Widget,
  HintWidget,
  NodeSpecializationWidget,
  getNodeWidgetConfig,
} from './inspectorWidgets';

import { RenderableNode } from '../../types';
import sanctuaryPropType from '../../utils/sanctuaryPropType';
import { getUtmSiteUrl } from '../../utils/urls';

import * as MESSAGES from '../messages';

const NodeInspector = ({ node, onPropUpdate, onNodeSpecializationChanged }) => {
  const type = XP.getNodeType(node);
  const baseName = XP.getBaseName(type);
  const nodeId = XP.getNodeId(node);

  const nodeHelpIcon =
    XP.isPathBuiltIn(type) || XP.isPathLocal(type) ? null : (
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

  const DeadNodeMessage = node.dead ? (
    <HintWidget text={MESSAGES.PATCH_FOR_NODE_IS_MISSING} />
  ) : null;

  return (
    <div className="Inspector-content">
      {nodeHelpIcon}

      <div className="inspectorTitle">
        <span className="nodeName">{baseName}</span>
      </div>

      <NodeSpecializationWidget
        nodeId={nodeId}
        specializations={node.specializations}
        onChange={onNodeSpecializationChanged}
        value={type}
      />

      {DeadNodeMessage}

      <PinWidgetsGroup node={node} onPropUpdate={onPropUpdate} />

      <Widget
        {...getNodeWidgetConfig(WIDGET_TYPE.LABEL)}
        entityId={nodeId}
        key={`node_label_${nodeId}`}
        kind={NODE_PROPERTY_KIND.PROP}
        keyName={NODE_PROPERTY_KEY.LABEL}
        label="Label"
        title="Node’s label"
        value={XP.getNodeLabel(node)}
        onPropUpdate={onPropUpdate}
      />

      <Widget
        {...getNodeWidgetConfig(WIDGET_TYPE.TEXTAREA)}
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
  onNodeSpecializationChanged: PropTypes.func.isRequired,
};

export default NodeInspector;
