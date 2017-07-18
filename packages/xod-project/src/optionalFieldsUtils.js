import R from 'ramda';
import { subtractObject } from 'xod-func-tools';

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

// :: ??? -> Node
export const addMissingOptionalNodeFields = R.merge(OPTIONAL_NODE_FIELDS);

// :: ??? -> Patch
export const addMissingOptionalPatchFields = R.compose(
  R.evolve({
    nodes: R.map(addMissingOptionalNodeFields),
  }),
  R.merge(OPTIONAL_PATCH_FIELDS)
);

// :: ??? -> Project
export const addMissingOptionalProjectFields = R.compose(
  R.evolve({
    patches: R.map(addMissingOptionalPatchFields),
  }),
  R.merge(OPTIONAL_PROJECT_FIELDS)
);

// Node -> ???
export const omitEmptyOptionalNodeFields = subtractObject(OPTIONAL_NODE_FIELDS);

// :: Patch -> ???
export const omitEmptyOptionalPatchFields = R.compose(
  R.evolve({
    nodes: R.map(omitEmptyOptionalNodeFields),
  }),
  subtractObject(OPTIONAL_PATCH_FIELDS)
);

// :: Project -> ???
export const omitEmptyOptionalProjectFields = R.compose(
  R.evolve({
    patches: R.map(omitEmptyOptionalPatchFields),
  }),
  subtractObject(OPTIONAL_PROJECT_FIELDS)
);
