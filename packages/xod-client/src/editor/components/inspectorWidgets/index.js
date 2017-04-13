import HintWidget from './HintWidget';
import BoolWidget from './BoolWidget';
import NumberWidget from './NumberWidget';
import PulseWidget from './PulseWidget';
import StringWidget from './StringWidget';
import IOLabelWidget from './IOLabelWidget';
import composeWidget from './Widget';

import { WIDGET_TYPE, ENTITY } from '../../constants';
import { KEYCODE } from '../../../utils/constants';

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
  [KEYCODE.COMMA]: widgetKeyDownHandlers.dot,
};

export const WIDGET_MAPPING = {
  [ENTITY.NODE]: {
    [WIDGET_TYPE.BOOL]: {
      component: BoolWidget,
      props: { type: 'boolean' },
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
      component: BoolWidget,
      props: {
        type: 'boolean',
        commitOnChange: true,
      },
    },
    [WIDGET_TYPE.IO_LABEL]: {
      component: IOLabelWidget,
      props: { type: 'string' },
    },
  },
};

export default {
  HintWidget,
  BoolWidget,
  NumberWidget,
  PulseWidget,
  StringWidget,
  IOLabelWidget,
  composeWidget,

  WIDGET_MAPPING,
};
