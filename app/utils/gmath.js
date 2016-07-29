
import R from 'ramda';

function findVertexesWithNoIncomingEdges(vertexes, edges) {
  return R.difference(
    vertexes,
    R.map(R.nth(1), edges)
  );
}

function hasIncomingEdges(vertex, edges) {
  const edgeIncoming = R.compose(R.equals(vertex), R.nth(1));
  return R.any(edgeIncoming, edges);
}

/**
  * Sorts graph vertexes topologically.
  *
  * @param {Array.<number>} vertexes
  *   List of graph vertexes with an arbitrary number (ID, for example) as payload.
  * @param {Array.<Array.<number, number>>} edges
  *   List of pairs in the form of `[sourceVertex, destinationVertex] that defines
  *   graph edges along with their direction.
  *
  * This is an implementation of Kahn’s algorithm.
  * @see https://en.wikipedia.org/wiki/Topological_sorting
  */
export function sortGraph(vertexes, edges) {
  let l = []; // Empty list that will contain the sorted elements
  let s = findVertexesWithNoIncomingEdges(vertexes, edges);
  while (s.length) {
    const n = R.head(s);
    s = R.drop(1, s);
    l = R.append(n, l);

    const hasEdgeFromN = (m) => R.contains([n, m], edges);

    R.forEach(m => {
      edges = R.without([[n, m]], edges);
      if (!hasIncomingEdges(m, edges)) {
        s = R.append(m, s);
      }

    }, R.filter(hasEdgeFromN, vertexes));
  }

  if (edges.length) {
    throw new Error("Graph has at least one cycle");
  }

  return l;
}
