import R from 'ramda';
import { subtractObject } from 'xod-func-tools';

import { def } from './types';

export const OPTIONAL_NODE_FIELDS = {
  boundValues: {},
  description: '',
  label: '',
};

export const OPTIONAL_PATCH_FIELDS = {
  attachments: [],
  description: '',
  impls: {},
  links: {},
  nodes: {},
};

export const OPTIONAL_PROJECT_FIELDS = {
  patches: {},
  authors: [],
  license: '', // MIT?
  version: '0.0.0',
  description: '',
};

export const addMissingOptionalNodeFields = R.merge(OPTIONAL_NODE_FIELDS);

export const addMissingOptionalPatchFields = R.compose(
  R.evolve({
    nodes: R.map(addMissingOptionalNodeFields),
  }),
  R.merge(OPTIONAL_PATCH_FIELDS)
);

export const addMissingOptionalProjectFields = R.compose(
  R.evolve({
    patches: R.map(addMissingOptionalPatchFields),
  }),
  R.merge(OPTIONAL_PROJECT_FIELDS)
);

export const omitEmptyOptionalNodeFields = def(
  'omitEmptyOptionalNodeFields :: Node -> Object',
  subtractObject(OPTIONAL_NODE_FIELDS)
);

export const omitEmptyOptionalPatchFields = def(
  'omitEmptyOptionalPatchFields :: Patch -> Object',
  R.compose(
    R.evolve({
      nodes: R.map(omitEmptyOptionalNodeFields),
    }),
    subtractObject(OPTIONAL_PATCH_FIELDS)
  )
);

export const omitEmptyOptionalProjectFields = def(
  'omitEmptyOptionalProjectFields :: Project -> Object',
  R.compose(
    R.evolve({
      patches: R.map(omitEmptyOptionalPatchFields),
    }),
    subtractObject(OPTIONAL_PROJECT_FIELDS)
  )
);
