import { getLocalPath } from 'xod-project';

export const MAIN_PATCH_PATH = getLocalPath('main');

export const NODE_PROPERTY_KIND = {
  PIN: 'pin',
  PROP: 'property',
};

export const NODE_PROPERTY_KEY = {
  LABEL: 'label',
  DESCRIPTION: 'description',
};

export default {
  NODE_PROPERTY_KIND,
  NODE_PROPERTY_KEY,
};
