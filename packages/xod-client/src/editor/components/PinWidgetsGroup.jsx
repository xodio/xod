import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import * as XP from 'xod-project';

import { NODE_PROPERTY_KIND } from '../../project/constants';
import Widgets, { getNodeWidgetConfig } from './inspectorWidgets';

import deepSCU from '../../utils/deepSCU';

// :: RenderableNode -> { components: {...}, props: {...} }
const createWidgetsConfig = R.compose(
  R.reduce(
    (acc, renderablePin) => {
      const widgetProps = R.applySpec({
        entityId: R.prop('nodeId'),
        kind: R.always(NODE_PROPERTY_KIND.PIN),
        key: ({ nodeId, key }) => `${nodeId}_${key}`,
        keyName: XP.getPinKey,
        type: XP.getPinType,
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

      const { component, props } = getNodeWidgetConfig(widgetProps.type);

      const widget = Widgets.composeWidget(component, props);

      return R.compose(
        R.assocPath(['components', widgetProps.key], widget),
        R.assocPath(['props', widgetProps.key], widgetProps)
      )(acc);
    },
    { components: {}, props: {} }
  ),
  R.apply(R.concat),
  R.map(R.sort(R.ascend(XP.getPinOrder))),
  R.juxt([R.filter(XP.isInputPin), R.filter(XP.isOutputPin)]),
  XP.normalizeEmptyPinLabels,
  R.values,
  R.prop('pins')
);

const dissocBoundValues = R.compose(
  R.over(R.lensProp('pins'), R.map(R.dissoc('value'))),
  R.dissoc('boundLiterals')
);

class PinWidgetsGroup extends React.Component {
  constructor(props) {
    super(props);
    this.state = createWidgetsConfig(props.node);

    this.shouldComponentUpdate = deepSCU.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const shouldCreateComponents = !R.equals(
      dissocBoundValues(this.props.node),
      dissocBoundValues(nextProps.node)
    );
    const widgetsData = createWidgetsConfig(nextProps.node);
    const dataToUpdate = shouldCreateComponents
      ? widgetsData
      : R.pick(['props'], widgetsData);
    this.setState(dataToUpdate);
  }

  render() {
    const widgets = R.compose(
      R.values,
      R.mapObjIndexed((Widget, key) => (
        <li key={key}>
          <Widget
            {...this.state.props[key]}
            onPropUpdate={this.props.onPropUpdate}
          />
        </li>
      ))
    )(this.state.components);

    return <ul>{widgets}</ul>;
  }
}

PinWidgetsGroup.propTypes = {
  node: PropTypes.any,
  onPropUpdate: PropTypes.func.isRequired,
};

export default PinWidgetsGroup;
