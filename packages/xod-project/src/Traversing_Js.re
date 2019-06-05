let listUpstreamPinsToNiixU:
  (array(Traversing.pinWithOwnerNode), Patch.t, Project.t) =>
  array(Traversing.pinWithOwnerNode) =
  (pinPairs, currentPatch, project) =>
    pinPairs
    ->Belt.List.fromArray
    ->(Traversing.listUpstreamPinsToNiix(currentPatch, project))
    ->Belt.List.toArray;
