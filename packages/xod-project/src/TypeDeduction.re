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
      |. Holes.Map.String.fromDict
      |. Map.String.map(nodeTypesDict =>
           nodeTypesDict
           |. Holes.Map.String.fromDict
           |. Map.String.map(XodFuncTools.Either.toResult)
         );

  let toJsDict: t => t_Js =
    drs =>
      drs
      |> Holes.Map.String.toDict
      |> Js.Dict.map((. nodeTypesMap) =>
           nodeTypesMap
           |> Holes.Map.String.toDict
           |> Js.Dict.map((. r) => XodFuncTools.Either.fromResult(r))
         );

  let get: (t, Node.id, Pin.key) => option(result) =
    (drs, nodeId, pinKey) =>
      drs
      |. Map.String.get(nodeId)
      |. Option.flatMap(nodeTypes =>
           Map.String.get(nodeTypes, pinKey)
         );

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
external deducePinTypesWithoutBuses_ :
  (Patch.t, Project.t) => ResultsMap.t_Js =
  "deducePinTypesWithoutBuses";

let jumperOutPinKey = "__out__";

let deducePinTypes: (Patch.t, Project.t) => ResultsMap.t =
  (patch, project) => {
    let matchingBusNodes = Buses.getMatchingBusNodes(patch);
    let jumperizedPatch = Buses.jumperizePatch(patch, matchingBusNodes);

    let deductionResultsForJumperizedPatch =
      jumperizedPatch
      |. deducePinTypesWithoutBuses_(project)
      |. ResultsMap.fromJsDict;

    List.reduce(
      matchingBusNodes,
      deductionResultsForJumperizedPatch,
      (deductionResults, (toBusNode, fromBusNodes)) => {
        let jumperNodeId = Node.getId(toBusNode);

        switch (
          ResultsMap.get(
            deductionResults,
            jumperNodeId,
            jumperOutPinKey,
          )
        ) {
        | None => deductionResults
        | Some(deductionResultForJumperOut) =>
          let fromBusNodeIds = List.map(fromBusNodes, Node.getId);

          let copyResultToFromBusNodes = drs =>
            List.reduce(fromBusNodeIds, drs, (accDrs, nodeId) =>
              ResultsMap.assoc(
                accDrs,
                nodeId,
                jumperOutPinKey,
                deductionResultForJumperOut,
              )
            );

          deductionResults
          |. ResultsMap.dissoc(jumperNodeId, jumperOutPinKey)
          |. copyResultToFromBusNodes;
        };
      },
    );
  };
