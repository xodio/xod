/** A list of tuples with `to-bus` node as the first element
    and a list of corresponding `from-bus` nodes as the second */
type matchingBusNodes = list((Node.t, list(Node.t)));

/** Returns a list of valid matching bus nodes for a given patch */
let getMatchingBusNodes: Patch.t => matchingBusNodes;

/** Replaces `to-bus` nodes with `jumper`s,
    creates links from it to `from-bus` nodes.
    see https://raw.githubusercontent.com/wiki/xodio/xod/images/illustrations-for-xod-source-code/xod-project/jumperize-before-after.png
 */
let jumperizePatch: (Patch.t, matchingBusNodes) => Patch.t;

/** "Jumperizes" a patch with a given path and all patches it depends on */
let jumperizePatchRecursively: (Project.t, Patch.path) => Project.t;

/** Splits links with given ids into buses. 
    Buses are named after output pin labels, so name conflicts are possible. */
let splitLinksToBuses:
  ((Node.t, Pin.t) => Position.t, Patch.path, list(Link.id), Project.t) =>
  Project.t;
