import * as R from 'ramda';
import * as XP from 'xod-project';
import { foldMaybe } from 'xod-func-tools';

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
