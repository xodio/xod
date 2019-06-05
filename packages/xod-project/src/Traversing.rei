/** A pair represents a Pin of the exact Node, so contains Pin object and Node object. */
type pinWithOwnerNode = (Pin.t, Node.t);

/** Returns a list of upstream pins starting from the first one of the list.
    Function traversing by links, drilling down inside composite nodes,
    passing through jumpers and resolving pairs of bus nodes. */
let listUpstreamPinsToNiix:
  (list(pinWithOwnerNode), Patch.t, Project.t) => list(pinWithOwnerNode);
