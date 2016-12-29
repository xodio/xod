import { PROPERTY_TYPE } from 'xod-core';

export const EDITOR_MODE = {
  CREATING_NODE: 'creatingNode',
  EDITING: 'editing',
  LINKING: 'linking',
  PANNING: 'panning',

  get DEFAULT() {
    return this.EDITING;
  },
};

export const WIDGET_TYPE = {
  BOOL: PROPERTY_TYPE.BOOL,
  NUMBER: PROPERTY_TYPE.NUMBER,
  STRING: PROPERTY_TYPE.STRING,
  PULSE: PROPERTY_TYPE.PULSE,
  IO_LABEL: 'IOLabel',
};
