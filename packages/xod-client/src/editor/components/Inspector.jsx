import R from 'ramda';
import React from 'react';
import Widgets from './inspectorWidgets';
import { noop } from 'xod-client/utils/ramda';
import {
  ENTITY,
  PIN_DIRECTION,
} from 'xod-core/project/constants';
import {
  WIDGET_TYPE,
  PROPERTY_KIND,
} from 'xod-client/project/constants';

const widgetAccordance = {
  [ENTITY.NODE]: {
    [WIDGET_TYPE.BOOL]: Widgets.BoolWidget,
    [WIDGET_TYPE.NUMBER]: Widgets.NumberWidget,
    [WIDGET_TYPE.STRING]: Widgets.StringWidget,
    [WIDGET_TYPE.PULSE]: Widgets.PulseWidget,
    [WIDGET_TYPE.IO_LABEL]: Widgets.IOLabelWidget,
  },
};

const defaultProp = {
  kind: PROPERTY_KIND.PROP,
  injected: false,
  type: 'string',
  value: '',
};

const labelProp = {
  kind: PROPERTY_KIND.PROP,
  injected: false,
  key: 'label',
  label: 'Label',
  type: 'string',
  value: '',
};

const getProp = (obj, node, key) => R.pipe(
  R.pathOr('', ['properties', key]),
  R.assoc('value', R.__, {}), // eslint-disable-line
  R.merge(obj)
)(node);

class Inspector extends React.Component {
  constructor(props) {
    super(props);

    this.createWidgets(props);
  }

  componentWillUpdate(nextProps) {
    this.createWidgets(nextProps);
  }

  getProperties(nodeType, node) {
    const props = [
      getProp(labelProp, node, 'label'),
    ];

    if (nodeType.properties) {
      R.pipe(
        R.values,
        R.map(R.merge(defaultProp)),
        R.map(prop => {
          const nodeVal = R.pathOr(null, ['properties', prop.key], node);
          if (nodeVal === null) { return prop; }
          return R.assoc('value', nodeVal, prop);
        }),
        R.forEach(prop => props.push(prop))
      )(nodeType.properties);
    }

    return props;
  }

  getPins(nodeType, node) {
    if (!nodeType.hasOwnProperty('pins')) {
      return [];
    }

    return R.pipe(
      R.values,
      R.reject(R.propEq('direction', PIN_DIRECTION.OUTPUT)),
      R.map(pin =>
        R.merge(
          pin,
          R.pick(['injected', 'value'], node.pins[pin.key])
        )
      ),
      R.map(R.assoc('kind', PROPERTY_KIND.PIN))
    )(nodeType.pins);
  }

  getInspectableProps(nodeType, node) {
    return R.concat(
      this.getProperties(nodeType, node),
      this.getPins(nodeType, node)
    );
  }

  createWidgets(props) {
    const selection = props.selection;

    if (selection.length === 0 || props.nodes[selection[0].id] === undefined) {
      this.createEmptySelectionWidgets();
    } else if (selection.length === 1) {
      const entity = (selection[0].entity);
      switch (entity) {
        case ENTITY.NODE: {
          this.createNodeWidgets(props, selection[0]);
          break;
        }
        case ENTITY.LINK:
          this.createLinkWidgets();
          break;
        default:
          this.widgets = [];
          break;
      }
    } else {
      this.createMultipleSelectionWidgets(selection);
    }
  }

  createEmptySelectionWidgets() {
    this.widgets = [
      new Widgets.HintWidget({
        text: 'Select a node to edit its properties.',
      }),
    ];
  }

  createNodeWidgets(props, selection) {
    const node = props.nodes[selection.id];
    const nodeType = props.nodeTypes[node.typeId];
    const properties = this.getInspectableProps(nodeType, node);

    if (properties.length === 0) {
      this.widgets = [
        new Widgets.HintWidget({
          text: 'There are no properties for the selected node.',
        }),
      ];
    } else {
      const widgets = [];
      properties.forEach((prop) => {
        const widgetType = prop.widget || prop.type;
        const factory = React.createFactory(
          Widgets.composeWidget(
            widgetAccordance[ENTITY.NODE][widgetType]
          )
        );
        const injected = prop.injected || false;

        widgets.push(
          factory({
            key: `${node.id}_${prop.key}`,
            keyName: `${node.id}_${prop.key}`,
            kind: prop.kind,
            label: prop.label,
            value: prop.value,
            injected,
            onPropUpdate: (newValue) => {
              this.props.onPropUpdate(node.id, prop.kind, prop.key, newValue);
            },
            onPinModeSwitch: () => {
              const inversedMode = !injected;

              this.props.onPinModeSwitch(node.id, prop.key, inversedMode);
            },
          })
        );
      });

      this.widgets = widgets;
    }
  }

  createLinkWidgets() {
    this.widgets = [
      new Widgets.HintWidget({
        text: 'Links have not any properties.',
      }),
    ];
  }

  createMultipleSelectionWidgets(selection) {
    this.widgets = [
      new Widgets.HintWidget({
        text: `You have selected: ${selection.length} elements.`,
      }),
    ];
  }

  render() {
    return (
      <div className="Inspector">
        <small className="title">Inspector</small>
        <ul>
          {this.widgets.map(widget =>
            <li key={widget.key}>
              {widget}
            </li>
          )}
        </ul>
      </div>
    );
  }
}

Inspector.propTypes = {
  selection: React.PropTypes.array,
  nodes: React.PropTypes.object,
  nodeTypes: React.PropTypes.object,
  onPropUpdate: React.PropTypes.func,
  onPinModeSwitch: React.PropTypes.func,
};

Inspector.defaultProps = {
  selection: [],
  nodes: {},
  nodeTypes: {},
  onPropUpdate: noop,
  onPinModeSwitch: noop,
};

export default Inspector;
