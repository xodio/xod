import R from 'ramda';
import * as XP from 'xod-project';
import * as XF from 'xod-func-tools';

import { def } from './types';

export const convertProjectToProjectFileContents = def(
  'convertProjectToProjectFileContents :: Project -> ProjectFileContents',
  R.compose(
    R.dissoc('@@type'),
    R.dissoc('patches'),
    R.dissoc('attachments')
  )
);

export const convertProjectFileContentsToProject = def(
  'convertProjectFileContentsToProject :: ProjectFileContents -> Project',
  R.compose(
    R.assoc('@@type', 'xod-project/Project'),
    R.assoc('patches', {}),
    R.assoc('attachments', []),
  )
);

export const convertPatchToPatchFileContents = def(
  'convertPatchToPatchFileContents :: Patch -> PatchFileContents',
  R.compose(
    XF.omitTypeHints,
    R.dissoc('attachments'),
    R.dissoc('path'),
    R.evolve({
      nodes: R.values,
      links: R.values,
      comments: R.values,
    })
  )
);

export const convertPatchFileContentsToPatch = def(
  'convertPatchFileContentsToPatch :: PatchFileContents -> Patch',
  fsPatch => R.compose(
    XF.explodeEither,
    XP.upsertLinks(R.map(R.assoc('@@type', 'xod-project/Link'), fsPatch.links)),
    XP.upsertNodes(R.map(R.assoc('@@type', 'xod-project/Node'), fsPatch.nodes)),
    XP.upsertComments(fsPatch.comments),
    XP.setPatchDescription(fsPatch.description),
    XP.createPatch
  )()
);

const optionalPatchFields = {
  nodes: [],
  links: [],
  comments: [],
  description: '',
};

export const addMissingOptionsToPatchFileContents = R.compose(
  R.evolve({
    nodes: R.map(XP.addMissingOptionalNodeFields),
  }),
  R.merge(optionalPatchFields)
);

export const omitDefaultOptionsFromPatchFileContents = R.compose(
  R.evolve({
    nodes: R.map(XP.omitEmptyOptionalNodeFields),
  }),
  XF.subtractObject(optionalPatchFields)
);

const OPTIONAL_PROJECT_FIELDS = {
  description: '',
  license: '',
  version: '0.0.0',
  authors: [],
};

export const addMissingOptionsToProjectFileContents =
  R.merge(OPTIONAL_PROJECT_FIELDS);

export const omitDefaultOptionsFromProjectFileContents =
  XF.subtractObject(OPTIONAL_PROJECT_FIELDS);
