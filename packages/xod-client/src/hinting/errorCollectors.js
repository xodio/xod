import * as R from 'ramda';
import { maybePath, foldMaybe, maybeProp } from 'xod-func-tools';

// :: { errors: StrMap [Error] } -> [Error]
export const getErrors = R.pipe(R.prop('errors'), R.values, R.flatten);

// :: NodeErrors -> [Error]
const mergeNodeErrors = nodeErrors =>
  R.concat(
    getErrors(nodeErrors),
    R.pipe(R.prop('pins'), R.values, R.map(getErrors), R.unnest)(nodeErrors)
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
    foldMaybe([], getErrors),
    R.chain(maybePath(['links', linkId])),
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
              R.unnest,
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
              R.unnest,
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
