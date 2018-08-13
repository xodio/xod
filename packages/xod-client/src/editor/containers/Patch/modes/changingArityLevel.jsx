import * as R from 'ramda';
import React from 'react';
import { HotKeys } from 'react-hotkeys';
import * as XP from 'xod-project';

import { EDITOR_MODE } from '../../../constants';

import PatchSVG from '../../../../project/components/PatchSVG';
import * as Layers from '../../../../project/components/layers';
import {
  computeConnectedPins,
  getRenderableNode,
} from '../../../../project/selectors';

import { SLOT_SIZE } from '../../../../project/nodeLayout';

import { getOffsetMatrix, bindApi, getMousePosition } from '../modeUtils';

let patchSvgRef = null;

const getDesiredArityLevel = (api, mousePosition) => {
  const deltaX = mousePosition.x - api.state.dragStartPosition.x;
  return R.compose(
    R.max(1),
    R.add(api.state.initialArityLevel),
    Math.ceil,
    R.divide(R.__, api.state.arityStep),
    Math.round,
    R.divide
  )(deltaX, SLOT_SIZE.WIDTH);
};

const changingArityLevel = {
  getInitialState(props, { dragStartPosition, nodeId }) {
    const node = R.prop(nodeId, props.nodes);
    const arityLevel = R.prop('arityLevel', node);
    return {
      nodeId,
      node,
      arityStep: R.prop('arityStep', node),
      initialArityLevel: arityLevel,
      desiredArityLevel: arityLevel,
      dragStartPosition,
      mousePosition: dragStartPosition,
    };
  },

  onMouseMove(api, event) {
    const mousePosition = getMousePosition(
      patchSvgRef,
      api.props.offset,
      event
    );
    const desiredArityLevel = getDesiredArityLevel(api, mousePosition);
    api.setState({ mousePosition, desiredArityLevel });
  },
  onMouseUp(api) {
    api.props.actions.changeArityLevel(
      api.state.nodeId,
      api.props.patchPath,
      api.state.desiredArityLevel
    );
    api.goToMode(EDITOR_MODE.DEFAULT);
  },

  render(api, project) {
    const currentPatch = XP.getPatchByPathUnsafe(api.props.patchPath, project);
    const connectedPins = R.compose(
      computeConnectedPins,
      R.indexBy(XP.getLinkId),
      XP.listLinks
    )(currentPatch);
    /**
     * To render Node with changed ArityLevel without excessive dispatching
     * we have to get an original Node, change its ArityLevel and pass
     * through selector that returns RenderableNode with computed Pins,
     * positions and etc.
     *
     * In addition to these manipulations we have to omit dead pins.
     */
    // :: RenderableNode
    const newNode = R.compose(
      renderableNode =>
        R.compose(
          R.assoc('id', `${renderableNode.id}-$CHANGING_ARITY`),
          R.assoc('isChangingArity', true),
          keysToOmit =>
            R.compose(
              R.assocPath(
                ['size', 'width'],
                renderableNode.size.width - keysToOmit.length * SLOT_SIZE.WIDTH
              ),
              R.over(R.lensProp('pins'), R.omit(keysToOmit))
            )(renderableNode),
          R.pluck('key'),
          R.filter(R.propEq('type', XP.PIN_TYPE.DEAD)),
          R.values,
          R.prop('pins')
        )(renderableNode),
      getRenderableNode(R.__, currentPatch, connectedPins, {}, project, {}),
      XP.setNodeArityLevel(api.state.desiredArityLevel),
      XP.getNodeByIdUnsafe(api.state.nodeId)
    )(currentPatch);

    // :: [RenderableNode]
    const nodes = R.compose(
      R.over(
        R.lensProp(api.state.nodeId),
        // Tune ghost Node
        R.assoc('isGhost', true)
      ),
      // Add new Node that shows how User will change ArityLevel
      R.assoc(newNode.id, newNode)
    )(api.props.nodes);

    return (
      <HotKeys className="PatchWrapper" handlers={{}}>
        <PatchSVG
          onMouseMove={bindApi(api, this.onMouseMove)}
          onMouseUp={bindApi(api, this.onMouseUp)}
          svgRef={svg => {
            patchSvgRef = svg;
          }}
          isInChangingArityLevelMode
        >
          <Layers.Background
            width={api.props.size.width}
            height={api.props.size.height}
            offset={api.props.offset}
          />
          <g transform={getOffsetMatrix(api.props.offset)}>
            <Layers.Comments
              comments={api.props.comments}
              selection={api.props.selection}
            />
            <Layers.Links
              links={api.props.links}
              selection={api.props.selection}
            />
            <Layers.Nodes
              nodes={nodes}
              selection={api.props.selection}
              linkingPin={api.props.linkingPin}
            />
            <Layers.LinksOverlay
              hidden // to avoid heavy remounting
              links={api.props.links}
              selection={api.props.selection}
            />
            <Layers.NodePinsOverlay
              hidden // to avoid heavy remounting
              nodes={api.props.nodes}
              linkingPin={api.props.linkingPin}
            />
          </g>
        </PatchSVG>
      </HotKeys>
    );
  },
};

export default changingArityLevel;
