import R from 'ramda';
import React from 'react';
import { ENTITY } from '../constants';

import Widgets, { WIDGET_MAPPING } from './inspectorWidgets';
import { noop } from '../../utils/ramda';

// :: props.data -> [{entity, id}]
const getEntitiesAndIds = R.map(R.pick(['entity', 'id']));

// :: props.data -> newProps.data -> boolean
const isSameSelection = R.useWith(R.equals, [getEntitiesAndIds, getEntitiesAndIds]);

// :: entityId -> propKey -> string
const getWidgetKey = R.curry((id, key) => `${id}_${key}`);

// :: props.data -> boolean
const isMany = R.compose(R.gt(R.__, 1), R.length);
const isOne = R.compose(R.equals(1), R.length);
const isEntity = entity => R.compose(R.equals(entity), R.prop('entity'), R.head);
const isNode = R.both(isOne, isEntity(ENTITY.NODE));
const isLink = R.both(isOne, isEntity(ENTITY.LINK));

// :: props.data -> { compoenents, props }
const createEmptySelectionWidgets = () => ({
  components: { empty: Widgets.HintWidget },
  props: { empty: { text: 'Select a node to edit its properties.' } },
});

// :: props.data -> { compoenents, props }
const createNodeWidgets = (data) => {
  const selection = data[0];
  const nodeId = selection.id;

  const result = R.reduce((acc, prop) => {
    const widgetType = prop.widget || prop.type;
    const injected = prop.injected || false;
    const widgetKey = getWidgetKey(nodeId, prop.key);

    const widget = Widgets.composeWidget(
      WIDGET_MAPPING[ENTITY.NODE][widgetType].component,
      WIDGET_MAPPING[ENTITY.NODE][widgetType].props
    );
    const props = {
      entityId: nodeId,
      key: widgetKey,
      keyName: prop.key,
      kind: prop.kind,
      label: prop.label,
      value: prop.value,
      injected,
    };

    return R.compose(
      R.assocPath(['components', widgetKey], widget),
      R.assocPath(['props', widgetKey], props)
    )(acc);
  }, { components: {}, props: {} })(selection.props);

  return result;
};

// :: props.data -> { components, props }
const createLinkWidgets = () => ({
  components: { empty: Widgets.HintWidget },
  props: { empty: { text: 'Links have not any properties.' } },
});

// :: props.data -> { components, props }
const createManyWidgets = data => ({
  components: { empty: Widgets.HintWidget },
  props: { empty: { text: `You have selected: ${data.length} elements.` } },
});

// :: props -> { compoenents, props }
const createWidgets = R.compose(
  R.cond([
    [R.isEmpty, createEmptySelectionWidgets],
    [isNode, createNodeWidgets],
    [isLink, createLinkWidgets],
    [isMany, createManyWidgets],
  ]),
  R.prop('data')
);

class Inspector extends React.Component {
  constructor(props) {
    super(props);
    this.state = createWidgets(props);
  }

  componentWillReceiveProps(nextProps) {
    const shouldCreateComponents = R.not(isSameSelection(this.props.data, nextProps.data));
    const widgetsData = createWidgets(nextProps);
    const dataToUpdate = (shouldCreateComponents) ? widgetsData : R.pick(['props'], widgetsData);
    this.setState(dataToUpdate);
  }

  render() {
    const widgets = R.compose(
      R.values,
      R.mapObjIndexed((Widget, key) =>
        <li key={key}>
          <Widget
            {...this.state.props[key]}
            onPropUpdate={this.props.onPropUpdate}
            onPinModeSwitch={this.props.onPinModeSwitch}
          />
        </li>
      )
    )(this.state.components);

    return (
      <div className="Inspector">
        <small className="title">Inspector</small>
        <ul>
          {widgets}
        </ul>
      </div>
    );
  }
}

Inspector.propTypes = {
  data: React.PropTypes.arrayOf(React.PropTypes.object),
  onPropUpdate: React.PropTypes.func,
  onPinModeSwitch: React.PropTypes.func,
};

Inspector.defaultProps = {
  data: [],
  onPropUpdate: noop,
  onPinModeSwitch: noop,
};

export default Inspector;
