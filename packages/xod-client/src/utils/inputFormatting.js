import * as R from 'ramda';

export const lowercaseKebabMask = R.replace(/[^a-z0-9-]/g, '');
export const patchBasenameMask = R.replace(/[^a-z0-9-,()]/g, '');
