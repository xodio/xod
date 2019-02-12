import * as R from 'ramda';
import { unquote, enquote } from 'xod-func-tools';
import { PIN_TYPE, isGenericType } from 'xod-project';

import HintWidget from './HintWidget';
import BoolWidget from './pinWidgets/BoolPinWidget';
import NumberWidget from './pinWidgets/NumberPinWidget';
import PulseWidget from './pinWidgets/PulsePinWidget';
import StringWidget from './pinWidgets/StringPinWidget';
import GenericPinWidget from './pinWidgets/GenericPinWidget';
import DisabledInputWidget from './pinWidgets/DisabledInputWidget';
import DescriptionWidget from './DescriptionWidget';
import LabelWidget from './LabelWidget';
import NodeSpecializationWidget from './NodeSpecializationWidget';
import Widget from './Widget';

import { WIDGET_TYPE } from '../../constants';
import { KEYCODE } from '../../../utils/constants';
import normalizeByte from '../../../utils/normalizeByte';
import normalizeNumber from '../../../utils/normalizeNumber';
import normalizePort from '../../../utils/normalizePort';
import normalizeGenericValue from '../../../utils/normalizeGenericValue';

const widgetKeyDownHandlers = {
  up: function up(event) {
    event.preventDefault();

    // TODO: deal with float prescision shenanigans
    const step = event.shiftKey ? 1 : 0.1;
    const newValue = parseFloat(event.target.value) + step;

    this.updateValue(newValue.toString(10), true);
  },
  down: function down(event) {
    event.preventDefault();

    const step = event.shiftKey ? 1 : 0.1;
    const newValue = parseFloat(event.target.value) - step;

    this.updateValue(newValue.toString(10), true);
  },
};

const widgetNumberKeysDownHandlers = {
  [KEYCODE.UP]: widgetKeyDownHandlers.up,
  [KEYCODE.DOWN]: widgetKeyDownHandlers.down,
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
    dataType: PIN_TYPE.BOOLEAN,
    commitOnChange: true,
  },
  [WIDGET_TYPE.NUMBER]: {
    component: NumberWidget,
    dataType: PIN_TYPE.NUMBER,
    keyDownHandlers: R.merge(widgetNumberKeysDownHandlers, submitOnEnter),
    normalizeValue: normalizeNumber,
  },
  [WIDGET_TYPE.BYTE]: {
    component: NumberWidget,
    dataType: PIN_TYPE.BYTE,
    keyDownHandlers: submitOnEnter,
    normalizeValue: normalizeByte,
  },
  [WIDGET_TYPE.STRING]: {
    component: StringWidget,
    dataType: PIN_TYPE.STRING,
    keyDownHandlers: submitOnEnter,
    normalizeValue: R.pipe(unquote, enquote),
  },
  [WIDGET_TYPE.LABEL]: {
    component: LabelWidget,
    dataType: PIN_TYPE.STRING,
    keyDownHandlers: submitOnEnter,
  },
  [WIDGET_TYPE.PULSE]: {
    component: PulseWidget,
    dataType: PIN_TYPE.PULSE,
    commitOnChange: true,
  },
  [WIDGET_TYPE.TEXTAREA]: {
    component: DescriptionWidget,
    dataType: 'string',
  },
  [WIDGET_TYPE.DEAD]: {
    component: DisabledInputWidget,
    dataType: PIN_TYPE.DEAD,
  },
  [WIDGET_TYPE.PORT]: {
    component: NumberWidget,
    dataType: PIN_TYPE.PORT,
    keyDownHandlers: submitOnEnter,
    normalizeValue: normalizePort,
  },
};

const getGenericTypeWidget = dataType => ({
  component: GenericPinWidget,
  dataType,
  keyDownHandlers: submitOnEnter,
  // normalize only almost valid byte values
  normalizeValue: normalizeGenericValue,
});

const getDisabledWidget = dataType => ({
  component: DisabledInputWidget,
  props: { dataType },
});

// :: PinType -> WidgetConfig
export const getNodeWidgetConfig = R.cond([
  [isGenericType, getGenericTypeWidget],
  [R.has(R.__, WIDGET_MAPPING), R.prop(R.__, WIDGET_MAPPING)],
  // This must be a custom type then
  [R.T, getDisabledWidget],
]);

export default {
  HintWidget,
  BoolWidget,
  NumberWidget,
  PulseWidget,
  StringWidget,
  DescriptionWidget,
  LabelWidget,
  NodeSpecializationWidget,
  Widget,

  WIDGET_MAPPING,
};
