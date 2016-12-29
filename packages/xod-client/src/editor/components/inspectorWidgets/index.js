import HintWidget from './HintWidget';
import BoolWidget from './BoolWidget';
import NumberWidget from './NumberWidget';
import PulseWidget from './PulseWidget';
import StringWidget from './StringWidget';
import IOLabelWidget from './IOLabelWidget';
import composeWidget from './Widget';

import { ENTITY } from 'xod-core';
import { WIDGET_TYPE } from '../../constants';
import { KEYCODE } from '../../../utils/constants';
import { PROPERTY_KIND } from '../../../project/constants';

const widgetKeyDownHandlers = {
  up: function up(event) {
    event.preventDefault();
    this.updateValue(
      this.parseValue(event.target.value) + 1
    );
  },
  down: function down(event) {
    event.preventDefault();
    this.updateValue(
      this.parseValue(event.target.value) - 1
    );
  },
  dot: function dot(event) {
    this.updateValue(
      this.parseValue(`${event.target.value}.`)
    );
  },
};

const widgetNumberKeysDownHandlers = {
  [KEYCODE.UP]: widgetKeyDownHandlers.up,
  [KEYCODE.DOWN]: widgetKeyDownHandlers.down,
  [KEYCODE.DOT]: widgetKeyDownHandlers.dot,
  [KEYCODE.COMMA]: widgetKeyDownHandlers.dot,
};

export const WIDGET_MAPPING = {
  [ENTITY.NODE]: {
    [WIDGET_TYPE.BOOL]: {
      component: BoolWidget,
      props: { type: 'bool' },
    },
    [WIDGET_TYPE.NUMBER]: {
      component: NumberWidget,
      props: {
        type: 'number',
        keyDownHandlers: widgetNumberKeysDownHandlers,
      },
    },
    [WIDGET_TYPE.STRING]: {
      component: StringWidget,
      props: { type: 'string' },
    },
    [WIDGET_TYPE.PULSE]: {
      component: PulseWidget,
      props: {
        type: 'pulse',
        keyDownHandlers: widgetNumberKeysDownHandlers,
      },
    },
    [WIDGET_TYPE.IO_LABEL]: {
      component: IOLabelWidget,
      props: { type: 'string' },
    },
  },
};

export const DEFAULT_NODE_PROPS = [
  {
    kind: PROPERTY_KIND.PROP,
    injected: false,
    key: 'label',
    label: 'Label',
    type: 'string',
    value: '',
  },
];

export default {
  HintWidget,
  BoolWidget,
  NumberWidget,
  PulseWidget,
  StringWidget,
  IOLabelWidget,
  composeWidget,

  WIDGET_MAPPING,
  DEFAULT_NODE_PROPS,
};
