import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import * as XP from 'xod-project';

import { NODE_PROPERTY_KIND } from '../../project/constants';
import { Widget, getNodeWidgetConfig } from './inspectorWidgets';

const PinWidgetsGroup = ({ node, onPropUpdate }) =>
  R.compose(
    widgets => <React.Fragment>{widgets}</React.Fragment>,
    R.map(renderablePin => {
      const widgetProps = R.applySpec({
        entityId: R.prop('nodeId'),
        kind: R.always(NODE_PROPERTY_KIND.PIN),
        key: ({ nodeId, key }) => `${nodeId}_${key}`,
        keyName: XP.getPinKey,
        dataType: XP.getPinType,
        label: XP.getPinLabel,
        value: R.prop('value'),
        direction: XP.getPinDirection,
        isConnected: R.prop('isConnected'),
        isInvalid: R.prop('isInvalid'),
        deducedType: R.prop('deducedType'),
        isBindable: XP.isPinBindable,
        isLastVariadicGroup: R.prop('isLastVariadicGroup'),
        specializations: R.prop('specializations'),
      })(renderablePin);

      return (
        <li key={widgetProps.key}>
          <Widget
            {...widgetProps}
            {...getNodeWidgetConfig(widgetProps.dataType)}
            onPropUpdate={onPropUpdate}
          />
        </li>
      );
    }),
    R.apply(R.concat),
    R.map(R.sort(R.ascend(XP.getPinOrder))),
    R.juxt([R.filter(XP.isInputPin), R.filter(XP.isOutputPin)]),
    XP.normalizeEmptyPinLabels,
    R.values,
    R.prop('pins')
  )(node);

PinWidgetsGroup.propTypes = {
  node: PropTypes.any,
  onPropUpdate: PropTypes.func.isRequired,
};

export default PinWidgetsGroup;
