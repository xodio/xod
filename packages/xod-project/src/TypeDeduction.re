open Belt;

module ResultsMap = {
  type result = Result.t(Pin.dataType, Js.Array.t(Pin.dataType));
  type t = Map.String.t(Map.String.t(result));
  type t_Js =
    Js.Dict.t(
      Js.Dict.t(
        XodFuncTools.Either.t(Js.Array.t(Pin.dataType), Pin.dataType),
      ),
    );
  let fromJsDict: t_Js => t =
    drs =>
      drs
      |. BeltHoles.Map.String.fromDict
      |. Map.String.map(nodeTypesDict =>
           nodeTypesDict
           |. BeltHoles.Map.String.fromDict
           |. Map.String.map(XodFuncTools.Either.toResult)
         );
  let toJsDict: t => t_Js =
    drs =>
      drs
      |> BeltHoles.Map.String.toDict
      |> Js.Dict.map((. nodeTypesMap) =>
           nodeTypesMap
           |> BeltHoles.Map.String.toDict
           |> Js.Dict.map((. r) => XodFuncTools.Either.fromResult(r))
         );
  let get: (t, Node.id, Pin.key) => option(result) =
    (drs, nodeId, pinKey) =>
      drs
      |. Map.String.get(nodeId)
      |. Option.flatMap(nodeTypes => Map.String.get(nodeTypes, pinKey));
  let assoc: (t, Node.id, Pin.key, result) => t =
    (drs, nodeId, pinKey, res) => {
      let updatedNodeTypes =
        drs
        |. Map.String.getWithDefault(nodeId, Map.String.empty)
        |. Map.String.set(pinKey, res);
      drs |. Map.String.set(nodeId, updatedNodeTypes);
    };
  let dissoc: (t, Node.id, Pin.key) => t =
    (drs, nodeId, pinKey) => {
      let updatedNodeTypes =
        drs
        |. Map.String.getWithDefault(nodeId, Map.String.empty)
        |. Map.String.remove(pinKey);
      if (Map.String.isEmpty(updatedNodeTypes)) {
        drs |. Map.String.remove(nodeId);
      } else {
        drs |. Map.String.set(nodeId, updatedNodeTypes);
      };
    };
};

[@bs.module ".."]
external deducePinTypesWithoutBuses_ : (Patch.t, Project.t) => ResultsMap.t_Js =
  "deducePinTypesWithoutBuses";

let toBusInputPinKey = "__in__";
let fromBusOutputPinKey = "__out__";

let deducePinTypes: (Patch.t, Project.t) => ResultsMap.t =
  (originalPatch, project) => {
    let matchingBusNodes = Buses.getMatchingBusNodes(originalPatch);
    let linkifiedPatch = Buses.linkifyPatch(originalPatch, matchingBusNodes);
    let deductionResultsForLinkifiedPatch =
      linkifiedPatch
      |. deducePinTypesWithoutBuses_(project)
      |. ResultsMap.fromJsDict;
    
    switch (List.length(matchingBusNodes)) {
      | 0 => deductionResultsForLinkifiedPatch
      | _ =>
        let linksByInputNodeId =
          originalPatch
          |. Patch.listLinks
          |. BeltHoles.List.groupByString(Link.getInputNodeId);
        List.reduce(
          matchingBusNodes,
          deductionResultsForLinkifiedPatch,
          (deductionResults, (toBusNode, fromBusNodes)) => {
            let toBusNodeId = Node.getId(toBusNode);

            linksByInputNodeId
            |. Map.String.get(toBusNodeId)
            |. Option.flatMap(List.head)
            |. Option.mapWithDefault(deductionResults, linkFromSource => {
                let sourceNodeId = Link.getOutputNodeId(linkFromSource);
                let sourcePinKey = Link.getOutputPinKey(linkFromSource);

                let deductionResultForSourceOutput = switch (
                  ResultsMap.get(deductionResults, sourceNodeId, sourcePinKey)
                ) {
                | Some(deductionResult) => deductionResult
                | None =>
                    // it's not in the deducted types,
                    // so it must be a non-generic pin
                    // (or even from a dead node)
                    originalPatch
                    |. Patch.getNodeById(sourceNodeId)
                    |. Option.flatMap(Project.getPatchByNode(project))
                    |. Option.flatMap(Patch.getPinByKey(_, sourcePinKey))
                    |. Option.map(Pin.getType)
                    |. Option.mapWithDefault(Result.Error([||]), pinType => Result.Ok(pinType));
                };

                let fromBusNodeIds = List.map(fromBusNodes, Node.getId);
                let copyResultToFromBusNodes = drs =>
                  List.reduce(fromBusNodeIds, drs, (accDrs, nodeId) =>
                    ResultsMap.assoc(
                      accDrs,
                      nodeId,
                      fromBusOutputPinKey,
                      deductionResultForSourceOutput,
                    )
                  );

                deductionResults
                |. ResultsMap.assoc(toBusNodeId, toBusInputPinKey, deductionResultForSourceOutput)
                |. copyResultToFromBusNodes;
              })
          },
        );
    }
  };
