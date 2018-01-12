import * as R from 'ramda';
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
const NODE_PREVIEW_HEIGHT = 93;

const PinInfo = ({ type, label, description }) => (
  <div className="pin-info">
    <div>
      <span className="label">{label}</span>
      <span className={cn('type', type)}>{type}</span>
    </div>
    <div className="description">
      <span>{description}</span>
    </div>
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


const PatchDocs = ({ patch, minimal }) => {
  const [inputPins, outputPins] = R.compose(
    R.partition(XP.isInputPin),
    XP.normalizePinLabels,
    XP.listPins
  )(patch);
  const nodeType = XP.getPatchPath(patch);
  const baseName = XP.getBaseName(nodeType);
  const description = XP.getPatchDescription(patch);

  const nodeProps = patchToNodeProps(patch);

  const scaleFactor = nodeProps.size.width < MAX_NODE_WIDTH
    ? 1
    : MAX_NODE_WIDTH / nodeProps.size.width;

  const fromNodeEdgeToPin = scaleFactor * (SLOT_SIZE.WIDTH / 2);
  const scaledNodeWidth = (nodeProps.size.width * scaleFactor) + fromNodeEdgeToPin;
  const distanceToFirstPin = minimal ? 0 : (
    fromNodeEdgeToPin +
    (NODE_POSITION_IN_PREVIEW.x * scaleFactor)
  ) - 1;
  const scaledNodePreviewHeight = NODE_PREVIEW_HEIGHT * scaleFactor;

  const distanceBetweenPins = minimal ? 0 : (scaleFactor * SLOT_SIZE.WIDTH) - 1;

  // because we never draw labels for terminal nodes
  const position = R.when(
    () => XP.isTerminalPatchPath(nodeType),
    R.assoc('y', XP.isInputTerminalPath(nodeType) ? 32 : 8),
    NODE_POSITION_IN_PREVIEW
  );

  const cls = cn('PatchDocs', {
    'PatchDocs--minimal': minimal,
  });
  const containerCls = cn('input-pins-container', {
    'input-pins-container--no-inputs': inputPins.length === 0,
    'input-pins-container--no-outputs': outputPins.length === 0,
  });

  return (
    <div className={cls}>
      <div className="baseName">
        <span>{baseName}</span>
      </div>
      <div className="nodeType">
        <span>{nodeType}</span>
      </div>
      <div className="description">
        <span>{description}</span>
      </div>
      <div className={containerCls} style={{ paddingLeft: distanceToFirstPin }}>
        {inputPins.length > 0 && [
          minimal && (
            <span className="pin-title" key="title">Inputs:</span>
          ),
          <InputPins
            key="inputPins"
            distanceBetweenPins={distanceBetweenPins}
            pins={inputPins}
          />,
        ]}
        {!minimal && (
          <svg className="node-preview" width={scaledNodeWidth} height={scaledNodePreviewHeight}>
            <rect className="bg" width="100%" height="100%" />
            <g transform={`scale(${scaleFactor})`}>
              <Node
                {...nodeProps}
                position={position}
              />
            </g>
          </svg>
        )}
      </div>
      {outputPins.length > 0 && (
        <div className="output-pins-container" style={{ paddingLeft: distanceToFirstPin }}>
          {minimal && (
            <span className="pin-title">Outputs:</span>
          )}
          <OutputPins
            distanceBetweenPins={distanceBetweenPins}
            pins={outputPins}
          />
        </div>
      )}
    </div>
  );
};

PatchDocs.defaultProps = {
  minimal: false,
};

PatchDocs.propTypes = {
  patch: PT.object.isRequired,
  minimal: PT.bool,
};

export default PatchDocs;
