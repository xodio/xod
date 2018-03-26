import * as R from 'ramda';
import { PIN_TYPE, isGenericType } from 'xod-project';

import HintWidget from './HintWidget';
import BoolWidget from './pinWidgets/BoolPinWidget';
import NumberWidget from './pinWidgets/NumberPinWidget';
import PulseWidget from './pinWidgets/PulsePinWidget';
import StringWidget from './pinWidgets/StringPinWidget';
import DisabledInputWidget from './pinWidgets/DisabledInputWidget';
import IOLabelWidget from './IOLabelWidget';
import DescriptionWidget from './DescriptionWidget';
import LabelWidget from './LabelWidget';
import NodeSpecializationWidget from './NodeSpecializationWidget';
import composeWidget from './Widget';

import { WIDGET_TYPE } from '../../constants';
import { KEYCODE } from '../../../utils/constants';

const widgetKeyDownHandlers = {
  up: function up(event) {
    event.preventDefault();
    this.updateValue(this.parseValue(event.target.value) + 1);
  },
  down: function down(event) {
    event.preventDefault();
    this.updateValue(this.parseValue(event.target.value) - 1);
  },
  dot: function dot(event) {
    this.updateValue(this.parseValue(`${event.target.value}.`));
  },
};

const widgetNumberKeysDownHandlers = {
  [KEYCODE.UP]: widgetKeyDownHandlers.up,
  [KEYCODE.DOWN]: widgetKeyDownHandlers.down,
  [KEYCODE.COMMA]: widgetKeyDownHandlers.dot,
};

const submitOnEnter = {
  [KEYCODE.ENTER]: function enter(event) {
    event.preventDefault();
    this.commit();
  },
};

const WIDGET_MAPPING = {
  [WIDGET_TYPE.BOOLEAN]: {
    component: BoolWidget,
    props: {
      type: PIN_TYPE.BOOLEAN,
      commitOnChange: true,
    },
  },
  [WIDGET_TYPE.NUMBER]: {
    component: NumberWidget,
    props: {
      type: PIN_TYPE.NUMBER,
      keyDownHandlers: R.merge(widgetNumberKeysDownHandlers, submitOnEnter),
    },
  },
  [WIDGET_TYPE.STRING]: {
    component: StringWidget,
    props: {
      type: PIN_TYPE.STRING,
      keyDownHandlers: submitOnEnter,
    },
  },
  [WIDGET_TYPE.PULSE]: {
    component: PulseWidget,
    props: {
      type: PIN_TYPE.PULSE,
      commitOnChange: true,
    },
  },
  [WIDGET_TYPE.TEXTAREA]: {
    component: DescriptionWidget,
    props: { type: 'string' },
  },
  [WIDGET_TYPE.DEAD]: {
    component: DisabledInputWidget,
    props: {
      type: PIN_TYPE.DEAD,
    },
  },
};

export const getNodeWidgetConfig = type =>
  isGenericType(type)
    ? {
        component: DisabledInputWidget,
        props: { type },
      }
    : WIDGET_MAPPING[type];

export default {
  HintWidget,
  BoolWidget,
  NumberWidget,
  PulseWidget,
  StringWidget,
  IOLabelWidget,
  DescriptionWidget,
  LabelWidget,
  NodeSpecializationWidget,
  composeWidget,

  WIDGET_MAPPING,
};
