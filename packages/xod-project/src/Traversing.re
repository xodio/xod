open Belt;

type pinWithOwnerNode = (Pin.t, Node.t);

/*
 ==============================================================================================================
   Utility functions
 ==============================================================================================================
 */

let isCompositionPatch = patch =>
  !Patch.isNotImplementedInXod(patch)
  && !Patch.isTerminal(patch)
  && !Patch.isRecord(patch)
  && !Patch.isUnpackRecord(patch);

let getUpstreamPinWithOwnerNodeFromInputPin:
  (Pin.t, Node.t, Patch.t, Project.t) => option(pinWithOwnerNode) =
  (pin, node, currentPatch, project) => {
    /* Traverse up if there is a link */
    let pinKey = Pin.getKey(pin);
    let nodeId = Node.getId(node);

    currentPatch
    ->Patch.listLinks
    ->(
        List.keep(link =>
          Link.getInputPinKey(link) === pinKey
          && Link.getInputNodeId(link) === nodeId
        )
      )
    ->List.head
    ->(
        Option.flatMap(link => {
          let upstreamPinKey = link->Link.getOutputPinKey;
          let upstreamNode =
            link->Link.getOutputNodeId |> Patch.getNodeById(currentPatch);
          let upstreamPin =
            upstreamNode
            ->(Option.flatMap(Project.getPatchByNode(project)))
            ->(
                Option.flatMap(patch =>
                  patch->(Patch.getPinByKey(upstreamPinKey))
                )
              );
          switch (upstreamPin, upstreamNode) {
          | (Some(pin), Some(node)) => Some((pin, node))
          | _ => None
          };
        })
      );
  };

let getUpstreamBusInputPinWithOwnerNode:
  (Node.t, Patch.t, Project.t) => option(pinWithOwnerNode) =
  (node, currentPatch, project) => {
    let busLabel = node->Node.getLabel;
    currentPatch
    ->Patch.listNodes
    ->(
        List.keep(node =>
          Node.getLabel(node) === busLabel
          && PatchPath.isToBus(Node.getType(node))
        )
      )
    ->List.head
    ->(
        Option.flatMap(toBusNode =>
          (toBusNode |> Project.getPatchByNode(project))
          ->(Option.flatMap(patch => patch->Patch.listInputPins->List.head))
          ->(Option.map(toBusInputPin => (toBusInputPin, toBusNode)))
        )
      );
  };

let drillDownAndGetTerminalsInputPin:
  (Pin.t, Patch.t, Project.t) => option(pinWithOwnerNode) =
  (pin, patchToDrillDown, project) => {
    let pinKey = Pin.getKey(pin);
    let _terminalNode = patchToDrillDown->(Patch.getNodeById(pinKey));
    _terminalNode->(
                     Option.flatMap(terminalNode =>
                       (
                         terminalNode->Node.getType
                         |> Project.getPatchByPath(project)
                       )
                       ->(
                           Option.flatMap(terminalPatch =>
                             terminalPatch->Patch.listInputPins->List.head
                           )
                         )
                       ->(
                           Option.map(terminalInputPin =>
                             (terminalInputPin, terminalNode)
                           )
                         )
                     )
                   );
  };

let listOf: 'a => list('a) = a => [a];

let isTerminalNode: Node.t => bool =
  node => node->Node.getType->PatchPath.isTerminal;

/** Updates Node Id by adding the parent Node Id in the beggining with "~" separator. */
let patchNodeIdWithParentNodeId:
  (Node.id, pinWithOwnerNode) => pinWithOwnerNode =
  (parentNodeId, (pin, node)) => {
    let originalNodeId = Node.getId(node);
    let newNodeId = String.concat("~", [parentNodeId, originalNodeId]);
    let patchedNode = Node.setId(newNodeId, node);
    (pin, patchedNode);
  };

/*
 ==============================================================================================================
   Traversing functions
 ==============================================================================================================
 */

let rec listUpstreamPinsToNiix:
  (list(pinWithOwnerNode), Patch.t, Project.t) => list(pinWithOwnerNode) =
  (pinPairs, currentPatch, project) =>
    pinPairs
    ->List.head
    ->(
        Option.flatMap(((pin, node)) =>
          switch (
            Pin.getDirection(pin),
            Project.getPatchByNode(project, node),
          ) {
          | (Pin.Input, _) =>
            pin
            ->(
                getUpstreamPinWithOwnerNodeFromInputPin(
                  node,
                  currentPatch,
                  project,
                )
              )
            ->(Option.map(listOf))
          | (Pin.Output, Some(patch)) when Patch.isFromBus(patch) =>
            node
            ->(getUpstreamBusInputPinWithOwnerNode(currentPatch, project))
            ->(Option.map(listOf))
          | (Pin.Output, Some(patch)) when Patch.isAbstract(patch) => None
          | (Pin.Output, Some(patch)) when isCompositionPatch(patch) =>
            /*
             Node is implemented in XOD.
             So, drill down and traverse from the output terminal up.
             If traversing ended with the input terminal (some kind of "identity" inside) —
             go back to the parent level and continue traversing from the input pin.
             Otherwise, return an output pin of this node.
             */
            drillDownAndGetTerminalsInputPin(pin, patch, project)
            ->(
                Option.flatMap(terminalPair =>
                  [terminalPair]
                  ->(listUpstreamPinsToNiix(patch, project))
                  ->(
                      insidePairs =>
                        switch (insidePairs) {
                        | [(_, insideLatestNode), ..._]
                            when isTerminalNode(insideLatestNode) =>
                          let inputTerminalPinKey =
                            Node.getId(insideLatestNode);
                          let parentNodeId = Node.getId(node);
                          (inputTerminalPinKey |> Patch.getPinByKey(patch))
                          ->(
                              Option.map(inputNodePin =>
                                insidePairs
                                ->(
                                    List.map(
                                      patchNodeIdWithParentNodeId(
                                        parentNodeId,
                                      ),
                                    )
                                  )
                                ->(List.add((inputNodePin, node)))
                              )
                            );
                        | [_, ..._] =>
                          let parentNodeId = Node.getId(node);
                          insidePairs
                          ->(
                              List.map(
                                patchNodeIdWithParentNodeId(parentNodeId),
                              )
                            )
                          ->(x => Some(x));
                        | _ => None
                        }
                    )
                )
              )
          | (Pin.Output, _) => None
          }
        )
      )
    ->(
        Option.map(newPairs =>
          List.concat(newPairs, pinPairs)
          ->(listUpstreamPinsToNiix(currentPatch, project))
        )
      )
    ->(Option.getWithDefault(pinPairs));
