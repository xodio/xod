open Belt;

type matchingBusNodes = list((Node.t, list(Node.t)));

[@bs.module ".."]
external fromBusPatchPath: Patch.path = "FROM_BUS_PATH";

[@bs.module ".."]
external toBusPatchPath: Patch.path = "TO_BUS_PATH";

[@bs.module ".."]
external jumperPatchPath: Patch.path = "JUMPER_PATCH_PATH";

let getMatchingBusNodes = patch => {
  let nodes = Patch.listNodes(patch);

  let toBusNodesByLabel =
    nodes
    |. List.keep(n => Node.getType(n) == toBusPatchPath)
    |. Holes.List.groupByString(Node.getLabel)
    /* having multiple `to-bus` nodes with the same label is forbidden,
       so exclude them from type resolution */
    |. Map.String.keep((_, ns) => List.length(ns) == 1)
    |. Holes.Map.String.keepMap(List.head);

  if (Map.String.isEmpty(toBusNodesByLabel)) {
    []; /* short-curcuit for optimization */
  } else {
    nodes
    |. List.keep(n => Node.getType(n) == fromBusPatchPath)
    |. Holes.List.groupByString(Node.getLabel)
    |. Map.String.keep((label, _) =>
         Map.String.has(toBusNodesByLabel, label)
       )
    |. Map.String.mapWithKey((label, fbNodes) =>
         (
           /* we just made sure that toBusNodesByLabel has those */
           Map.String.getExn(toBusNodesByLabel, label),
           fbNodes,
         )
       )
    |. Map.String.valuesToArray
    |. List.fromArray;
  };
};

let jumperizePatch: (Patch.t, matchingBusNodes) => Patch.t =
  (patch, matchingBusNodes) => {
    let linksByOutputNodeId =
      patch |. Patch.listLinks |. Holes.List.groupByString(Link.getOutputNodeId);

    List.reduce(
      matchingBusNodes,
      patch,
      (jPatch, (toBusNode, fromBusNodes)) => {
        let jumperNodeId = Node.getId(toBusNode);

        let linksFromJumperToBusDestinations =
          fromBusNodes
          |. List.map(fromBusNode =>
               Map.String.getWithDefault(
                 linksByOutputNodeId,
                 Node.getId(fromBusNode),
                 [],
               )
             )
          |. List.flatten
          |. List.map(link =>
               Link.create(
                 ~toPin=Link.getInputPinKey(link),
                 ~toNode=Link.getInputNodeId(link),
                 ~fromPin="__out__",
                 ~fromNode=jumperNodeId,
               )
             );

        let dissocFromBusNodes = patchWithFromBusNodes =>
          List.reduce(fromBusNodes, patchWithFromBusNodes, (accP, n) =>
            Patch.dissocNode(accP, Node.getId(n))
          );

        jPatch
        |. Patch.assocNode(Node.setType(jumperPatchPath, toBusNode))
        |. dissocFromBusNodes
        |. Patch.upsertLinks(linksFromJumperToBusDestinations)
        |. Result.getExn;
      },
    );
  };

let jumperizePatchRecursively = (project, entryPatchPath) =>
  project
  |. Project.getPatchDependencies(entryPatchPath)
  |. Belt.List.add(entryPatchPath)
  |. Belt.List.keepMap(Project.getPatchByPath(project))
  |. Belt.List.map(p => jumperizePatch(p, getMatchingBusNodes(p)))
  |> Project.assocPatchList(project);
