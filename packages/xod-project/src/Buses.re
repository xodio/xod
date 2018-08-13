open Belt;

type matchingBusNodes = list((Node.t, list(Node.t)));

[@bs.module ".."] external fromBusPatchPath : Patch.path = "FROM_BUS_PATH";

[@bs.module ".."] external toBusPatchPath : Patch.path = "TO_BUS_PATH";

[@bs.module ".."] external jumperPatchPath : Patch.path = "JUMPER_PATCH_PATH";

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
      patch
      |. Patch.listLinks
      |. Holes.List.groupByString(Link.getOutputNodeId);
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
  |. List.add(entryPatchPath)
  |. List.keepMap(Project.getPatchByPath(project))
  |. List.map(p => jumperizePatch(p, getMatchingBusNodes(p)))
  |> Project.assocPatchList(project);

/* move to Link module? */
type linkEnd = (Node.id, Pin.key);

let getLinkOutput: Link.t => linkEnd =
  link => (Link.getOutputNodeId(link), Link.getOutputPinKey(link));

module LinkEndComparator =
  Belt.Id.MakeComparable(
    {
      type t = linkEnd;
      let cmp = Pervasives.compare;
    },
  );

let splitLinksToBuses:
  ((Node.t, Pin.t) => Position.t, Patch.path, list(Link.id), Project.t) =>
  Project.t =
  (getBusPosition, patchPath, linkIds, project) =>
    switch (Project.getPatchByPath(project, patchPath)) {
    | None => project
    | Some(patch) =>
      let linksToSplit =
        patch
        |. Patch.listLinks
        |. List.keep(link => List.has(linkIds, Link.getId(link), (==)))
        /* exclude links already connected to buses */
        |. List.keep(link => {
             let isInputConnectedToBusNode =
               link
               |> Link.getInputNodeId
               |> Patch.getNodeById(patch)
               |. Option.mapWithDefault(false, n =>
                    Node.getType(n) == toBusPatchPath
                  );
             let isOutputConnectedToBusNode =
               link
               |> Link.getOutputNodeId
               |> Patch.getNodeById(patch)
               |. Option.mapWithDefault(false, n =>
                    Node.getType(n) == fromBusPatchPath
                  );
             ! isOutputConnectedToBusNode && ! isInputConnectedToBusNode;
           });
      let (linksToUpsert, nodesToUpsert): (list(Link.t), list(Node.t)) =
        linksToSplit
        |. Holes.List.groupBy((module LinkEndComparator), getLinkOutput)
        |. Map.mapWithKey(((nodeId, pinKey), links) => {
             let (linkToBus, toBusNode) =
               patch
               |. Patch.listLinks
               /* find ALL links coming out of our pin — not just ones that are going to be split */
               |. List.keep(link => getLinkOutput(link) == (nodeId, pinKey))
               /* find an existing `to-bus` node connected to our output pin */
               |. List.keepMap(link =>
                    link
                    |> Link.getInputNodeId
                    |> Patch.getNodeById(patch)
                    |. Option.flatMap(node =>
                         Node.getType(node) == toBusPatchPath ?
                           Some(node) : None
                       )
                    |. Option.map(node => (link, node))
                  )
               |. List.head
               /* if there is no existing `to-bus` node, let's create one */
               |. Holes.Option.getWithLazyDefault(() => {
                    let (busLabel, toBusPosition) =
                      Patch.getNodeById(patch, nodeId)
                      |. Option.flatMap(outputNode =>
                           outputNode
                           |> Project.getPatchByNode(project)
                           |. Option.flatMap(Patch.getPinByKey(_, pinKey))
                           |. Option.map(outputPin => (outputNode, outputPin))
                         )
                      |. Option.map(((outputNode, outputPin)) => {
                           let label =
                             Node.isPinNode(outputNode) ?
                               Node.getLabel(outputNode) :
                               Pin.getLabel(outputPin);
                           let busPosition =
                             getBusPosition(outputNode, outputPin);
                           (label, busPosition);
                         })
                      /* something has to be very wrong.
                         for example, we attempt to split a dead link */
                      |. Option.getWithDefault(("", Position.origin));
                    let toBusNode =
                      Node.create(toBusPatchPath)
                      |. Node.setLabel(busLabel)
                      |. Node.setPosition(toBusPosition);
                    (
                      Link.create(
                        ~fromNode=nodeId,
                        ~fromPin=pinKey,
                        ~toNode=Node.getId(toBusNode),
                        ~toPin="__in__",
                      ),
                      toBusNode,
                    );
                  });
             let busNodesLabel = toBusNode |> Node.getLabel;
             let fromBusNodesAndLinks: list((Link.t, Node.t)) =
               links
               |. List.keepMap(link =>
                    link
                    |> Link.getInputNodeId
                    |> Patch.getNodeById(patch)
                    |. Option.map(destinationNode => (link, destinationNode))
                  )
               |. List.keepMap(((linkToSplit, destinationNode)) => {
                    let destinationPinKey = linkToSplit |> Link.getInputPinKey;
                    destinationNode
                    |> Project.getPatchByNode(project)
                    |. Option.flatMap(
                         Patch.getPinByKey(_, destinationPinKey),
                       )
                    |. Option.map(destinationPin => {
                         let fromBusPosition =
                           getBusPosition(destinationNode, destinationPin);
                         let fromBusNode =
                           Node.create(fromBusPatchPath)
                           |. Node.setLabel(busNodesLabel)
                           |. Node.setPosition(fromBusPosition);
                         (
                           Link.create(
                             ~toNode=Node.getId(destinationNode),
                             ~toPin=destinationPinKey,
                             ~fromNode=Node.getId(fromBusNode),
                             ~fromPin="__out__",
                           ),
                           fromBusNode,
                         );
                       });
                  });
             List.reduce(
               fromBusNodesAndLinks,
               ([linkToBus], [toBusNode]),
               ((ls, ns), (l, n)) =>
               ([l, ...ls], [n, ...ns])
             );
           })
        |. Map.toList
        |. List.map(snd)
        |. List.reduce(([], []), ((ls1, ns1), (ls2, ns2)) =>
             (List.concat(ls1, ls2), List.concat(ns1, ns2))
           );
      patch
      |. Patch.omitLinks(linksToSplit)
      |. Patch.upsertNodes(nodesToUpsert)
      |. Patch.upsertLinks(linksToUpsert)
      |. Result.getExn  /* TODO: should theese even return Result after #1369 ? */
      |> Project.assocPatch(project, patchPath);
    };
