import * as R from 'ramda';
import * as XP from 'xod-project';
import { foldMaybe, mapIndexed } from 'xod-func-tools';

import { UPLOAD_MSG_TYPE } from './constants';

export const createSystemMessage = message => ({
  type: UPLOAD_MSG_TYPE.SYSTEM,
  message,
});

export const createFlasherMessage = message => ({
  type: UPLOAD_MSG_TYPE.UPLOADER,
  message,
});

export const createErrorMessage = message => ({
  type: UPLOAD_MSG_TYPE.ERROR,
  message,
});

export const createOutgoingLogMessage = message => ({
  type: UPLOAD_MSG_TYPE.LOG_OUTGOING,
  message,
});

// :: PatchPath -> Map NodeId Int -> Project -> Nullable Int
export const getTetheringInetNodeId = R.curry(
  (patchPath, nodeIdsMap, project) =>
    R.compose(
      foldMaybe(
        null,
        R.compose(R.propOr(null, R.__, nodeIdsMap), XP.getNodeId)
      ),
      R.chain(XP.findNodeBy(XP.isTetheringInetNode)),
      XP.getPatchByPath(patchPath)
    )(project)
);

export const isErrorMessage = R.propEq('type', UPLOAD_MSG_TYPE.ERROR);

// `a~b~c` -> `a~b`
export const removeLastNodeIdInChain = R.replace(/(~[^~]+)$/, '');

// :: Project -> [NodeId] -> PatchPath -> [{ nodeId: NodeId, label: String }]
export const getTableLogSourceLabels = R.curry(
  (project, sourceNodeIds, rootPatchPath) =>
    R.compose(
      R.map(
        R.applySpec({
          nodeId: R.prop('nodeId'),
          label: R.compose(
            R.join(' > '),
            R.concat([rootPatchPath]),
            R.pluck('finalLabel'),
            R.prop('chunks')
          ),
        })
      ),
      R.reduce((acc, nextSource) => {
        const reducedChunks = R.pluck('chunks', acc);
        const result = R.over(
          R.lensProp('chunks'),
          mapIndexed((chunk, idx) =>
            R.compose(
              R.ifElse(
                R.equals(0),
                () => R.assoc('finalLabel', chunk.label, chunk),
                num =>
                  R.assoc('finalLabel', `${chunk.label} #${num + 1}`, chunk)
              ),
              R.length,
              R.uniqBy(R.both(R.prop('label'), R.prop('nodeId'))),
              R.filter(
                rc =>
                  rc.nodeId !== chunk.nodeId &&
                  rc.label === chunk.label &&
                  rc.parent === chunk.parent
              ),
              R.reject(R.isNil),
              R.pluck(idx)
            )(reducedChunks)
          ),
          nextSource
        );
        return [...acc, result];
      }, []),
      R.map(nodeId => {
        // Convert chained NodeId (`a~b~c`) into [NodeId] (['a', 'b', 'c'])
        const splittedNodeId = R.split('~', nodeId);
        return R.compose(
          foldMaybe(
            {
              nodeId,
              chunks: [
                {
                  nodeId,
                  label: [`DELETED (${nodeId})`],
                },
              ],
            },
            R.applySpec({
              nodeId: R.always(nodeId),
              chunks: R.init, // Get rid of last NodeId, which points to internal `tsv-log`
            })
          ),
          R.map(
            mapIndexed((chunk, idx) =>
              R.compose(
                R.assoc('parent', R.__, chunk),
                R.join('~'),
                R.concat([rootPatchPath]),
                R.take(idx)
              )(splittedNodeId)
            )
          ),
          XP.mapNestedNodes(
            node => {
              const nodeType = XP.getNodeType(node);
              const label = XP.getNodeLabel(node);
              return {
                nodeType,
                nodeId: XP.getNodeId(node),
                label: label.length ? label : XP.getBaseName(nodeType),
              };
            },
            project,
            rootPatchPath
          )
        )(splittedNodeId);
      })
    )(sourceNodeIds)
);
