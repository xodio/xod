import * as R from 'ramda';
import { maybePath, foldMaybe, maybeProp } from 'xod-func-tools';

// :: NodeErrors -> [Error]
const mergeNodeErrors = nodeErrors =>
  R.concat(
    nodeErrors.errors,
    R.pipe(R.prop('pins'), R.values, R.pluck('errors'), R.reduce(R.concat, []))(
      nodeErrors
    )
  );

// :: PatchPath -> NodeId -> Map PatchPath PatchErrors -> [Error]
export const getAllErrorsForNode = R.curry((patchPath, nodeId, errors) =>
  R.compose(
    foldMaybe([], mergeNodeErrors),
    R.chain(maybePath(['nodes', nodeId])),
    maybeProp(patchPath)
  )(errors)
);

// :: PatchPath -> LinkId -> Map PatchPath PatchErrors -> [Error]
export const getAllErrorsForLink = R.curry((patchPath, linkId, errors) =>
  R.compose(
    foldMaybe([], R.identity),
    R.chain(maybePath(['links', linkId, 'errors'])),
    maybeProp(patchPath)
  )(errors)
);

// :: PatchPath -> Map PatchPath PatchErrors -> [Error]
export const getAllErrorsForPatch = R.curry((patchPath, errors) =>
  R.compose(
    foldMaybe(
      [],
      R.converge(R.concat, [
        R.compose(
          foldMaybe(
            [],
            R.compose(
              R.reduce(R.concat, []),
              R.map(getAllErrorsForNode(patchPath, R.__, errors)),
              R.keys
            )
          ),
          maybeProp('nodes')
        ),
        R.compose(
          foldMaybe(
            [],
            R.compose(
              R.reduce(R.concat, []),
              R.map(getAllErrorsForLink(patchPath, R.__, errors)),
              R.keys
            )
          ),
          maybeProp('links')
        ),
      ])
    ),
    maybeProp(patchPath)
  )(errors)
);

export const getActingPatchPath = maybePath(['payload', 'patchPath']);
