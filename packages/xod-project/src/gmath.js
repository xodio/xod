import * as R from 'ramda';
import { Either } from 'ramda-fantasy';
import { fail } from 'xod-func-tools';

export function findVertexesWithNoIncomingEdges(vertexes, edges) {
  return R.difference(vertexes, R.map(R.nth(1), edges));
}

// Packs edges list in a data structure optimized for use in `sortGraph`
//
// :: [[Int, Int]] -> EdgesSet
const makeEdgesSet = R.reduce(
  // `toString` is needed because Ramda gets "confused" by numeric keys and produces arrays
  //  (for example, https://github.com/ramda/ramda/blob/v0.24.1/src/dissocPath.js#L33)
  // `n` and `m` are inverted to make `hasIncomingEdges` faster
  (s, [n, m]) => R.assocPath([m.toString(), n.toString()], true, s),
  {}
);

// :: Int -> EdgesSet -> Int -> Boolean
const hasEdgeFrom = (n, edgesSet) => m => R.pathOr(false, [m, n], edgesSet);

// :: Int -> EdgesSet -> Boolean
const hasIncomingEdges = (vertex, edgesSet) => !!R.prop(vertex, edgesSet);

// :: Int -> Int -> EdgesSet -> EdgesSet
const dissocEdge = (n, m, edgesSet) =>
  R.compose(
    R.when(R.pipe(R.propOr({}, m), R.isEmpty), R.dissoc(m.toString())),
    R.dissocPath([m.toString(), n.toString()])
  )(edgesSet);

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
  const l = []; // Empty list that will contain the sorted elements
  let s = findVertexesWithNoIncomingEdges(vertexes, edges);
  let edgesLeft = makeEdgesSet(edges);

  const excludeEdgesFrom = n => m => {
    edgesLeft = dissocEdge(n, m, edgesLeft);
    if (!hasIncomingEdges(m, edgesLeft)) {
      s.push(m);
    }
  };

  while (s.length) {
    const [n, ...restS] = s;
    s = restS;
    l.push(n);

    R.forEach(
      excludeEdgesFrom(n),
      R.filter(hasEdgeFrom(n, edgesLeft), vertexes)
    );
  }

  if (!R.isEmpty(edgesLeft)) {
    return fail('LOOPS_DETECTED', {});
  }

  return Either.of(l);
}
