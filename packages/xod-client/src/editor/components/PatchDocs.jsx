import R from 'ramda';
import React from 'react';
import PT from 'prop-types';
import cn from 'classnames';

import * as XP from 'xod-project';

import Node from '../../project/components/Node';
import { patchToNodeProps } from '../../project/utils';
import { SLOT_SIZE } from '../../project/nodeLayout';

const NODE_POSITION_IN_PREVIEW = {
  x: 3,
  y: 20, // compensate for labels outside the node
};

const MAX_NODE_WIDTH = 245 - (NODE_POSITION_IN_PREVIEW.x * 2);
const NODE_PREVIEW_HEIGHT = 101;

const PinInfo = ({ type, label, description }) => (
  <div className="pin-info">
    <div>
      <span className="label">{label}</span>
      <span className={cn('type', type)}>{type}</span>
    </div>
    <div className="description">{description}</div>
  </div>
);

PinInfo.propTypes = {
  type: PT.string.isRequired,
  label: PT.string.isRequired,
  description: PT.string.isRequired,
};

const InputPins = ({ pins, distanceBetweenPins }) => {
  if (R.isEmpty(pins)) return null;

  const [pin, ...restPins] = pins;
  const isLastPin = R.isEmpty(restPins);

  return (
    <div
      className={cn('input-pin', { 'last-pin': isLastPin })}
      style={{ paddingLeft: distanceBetweenPins }}
    >
      <div className="pin-info-container">
        <PinInfo {...pin} />
      </div>
      {isLastPin ? null : <InputPins pins={restPins} distanceBetweenPins={distanceBetweenPins} />}
    </div>
  );
};

InputPins.propTypes = {
  pins: PT.array.isRequired,
  distanceBetweenPins: PT.number.isRequired,
};

const OutputPins = ({ pins, distanceBetweenPins, isFirst }) => {
  if (R.isEmpty(pins)) return null;

  const [pin, ...restPins] = pins;
  const isLastPin = R.isEmpty(restPins);

  return (
    <div
      className={cn('output-pin', { 'first-pin': isFirst })}
      style={{ paddingLeft: isFirst ? 0 : distanceBetweenPins }}
    >
      {isLastPin ? (
        <div
          className="output-pin last-pin"
          style={{ paddingLeft: distanceBetweenPins }}
        />
      ) : (
        <OutputPins
          pins={restPins}
          distanceBetweenPins={distanceBetweenPins}
          isFirst={false}
        />
      )}
      <div className="pin-info-container">
        <PinInfo {...pin} />
      </div>
    </div>
  );
};

OutputPins.propTypes = {
  pins: PT.array.isRequired,
  distanceBetweenPins: PT.number.isRequired,
  isFirst: PT.bool,
};

OutputPins.defaultProps = {
  isFirst: true,
};


const PatchDocs = ({ patch }) => {
  const inputPins = XP.listInputPins(patch);
  const outputPins = XP.listOutputPins(patch);
  const nodeType = XP.getPatchPath(patch);
  const baseName = XP.getBaseName(nodeType);
  const description = XP.getPatchDescription(patch);

  const nodeProps = patchToNodeProps(patch);

  const scaleFactor = nodeProps.size.width < MAX_NODE_WIDTH
    ? 1
    : MAX_NODE_WIDTH / nodeProps.size.width;

  const scaledNodeWidth = nodeProps.size.width * scaleFactor;
  const fromNodeEdgeToPin = scaleFactor * (SLOT_SIZE.WIDTH / 2);
  const nodeMargin = (MAX_NODE_WIDTH - scaledNodeWidth - NODE_POSITION_IN_PREVIEW.x) / 2;
  const distanceToFirstPin = (
    nodeMargin +
    fromNodeEdgeToPin +
    (NODE_POSITION_IN_PREVIEW.x * scaleFactor)
  ) - 1;
  const scaledNodePreviewHeight = NODE_PREVIEW_HEIGHT * scaleFactor;

  const distanceBetweenPins = (scaleFactor * SLOT_SIZE.WIDTH) - 1;

  return (
    <div className="PatchDocs">
      <div className="input-pins-container" style={{ paddingLeft: distanceToFirstPin }}>
        <InputPins
          distanceBetweenPins={distanceBetweenPins}
          pins={inputPins}
        />
        <svg className="node-preview" height={scaledNodePreviewHeight}>
          <rect className="bg" width="100%" height="100%" />
          <g transform={`scale(${scaleFactor}) translate(${nodeMargin})`}>
            <Node
              {...nodeProps}
              position={NODE_POSITION_IN_PREVIEW}
            />
          </g>
        </svg>
      </div>
      <div className="output-pins-container" style={{ paddingLeft: distanceToFirstPin }}>
        <OutputPins
          distanceBetweenPins={distanceBetweenPins}
          pins={outputPins}
        />
      </div>
      <div className="baseName">{baseName}</div>
      <div className="nodeType">{nodeType}</div>
      <div className="description">{description}</div>
    </div>
  );
};

PatchDocs.propTypes = {
  patch: PT.object.isRequired,
};

export default PatchDocs;
