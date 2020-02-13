/** A list of tuples with `to-bus` node as the first element
    and a list of corresponding `from-bus` nodes as the second */
type matchingBusNodes = list((Node.t, list(Node.t)));

/** Returns a list of valid matching bus nodes for a given patch */
let getMatchingBusNodes: Patch.t => matchingBusNodes;

/** Converts matching bus nodes into links */
let linkifyPatch: (Patch.t, matchingBusNodes) => Patch.t;

/** "Linkifies" a patch with a given path and all patches it depends on */
let linkifyPatchRecursively: (Project.t, Patch.path) => Project.t;

/** Splits links with given ids into buses.
    Buses are named after output pin labels, so name conflicts are possible. */
let splitLinksToBuses:
  ((Node.t, Pin.t) => Position.t, Patch.path, list(Link.id), Project.t) =>
  Project.t;
