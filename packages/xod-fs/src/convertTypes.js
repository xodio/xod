import R from 'ramda';
import * as XP from 'xod-project';
import * as XF from 'xod-func-tools';

import { def } from './types';

export const convertProjectToProjectFileContents = def(
  'convertProjectToProjectFileContents :: Project -> ProjectFileContents',
  R.compose(
    R.dissoc('patches'),
    R.dissoc('impls'),
    R.dissoc('attachments')
  )
);

export const convertProjectFileContentsToProject = def(
  'convertProjectFileContentsToProject :: ProjectFileContents -> Project',
  R.compose(
    R.assoc('patches', {}),
    R.assoc('attachments', []),
    R.assoc('impls', {})
  )
);

export const convertPatchToPatchFileContents = def(
  'convertPatchToPatchFileContents :: Patch -> PatchFileContents',
  R.compose(
    R.dissoc('attachments'),
    R.dissoc('impls'),
    R.dissoc('path'),
    R.evolve({
      nodes: R.values,
      links: R.values,
    })
  )
);

export const convertPatchFileContentsToPatch = def(
  'convertPatchFileContentsToPatch :: PatchFileContents -> Patch',
  fsPatch => R.compose(
    XF.explodeEither,
    XP.upsertLinks(fsPatch.links),
    XP.upsertNodes(fsPatch.nodes),
    XP.setPatchDescription(fsPatch.description),
    XP.createPatch
  )()
);

const optionalPatchFields = {
  nodes: [],
  links: [],
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
