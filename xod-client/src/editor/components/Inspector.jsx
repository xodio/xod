import R from 'ramda';
import React from 'react';
import Widgets from './inspectorWidgets';
import { ENTITY, PROPERTY_TYPE } from 'xod-core/project/constants';

const widgetAccordance = {
  [ENTITY.NODE]: {
    [PROPERTY_TYPE.BOOL]: Widgets.BoolWidget,
    [PROPERTY_TYPE.NUMBER]: Widgets.NumberWidget,
    [PROPERTY_TYPE.STRING]: Widgets.StringWidget,
    [PROPERTY_TYPE.PULSE]: Widgets.NumberWidget,
    [PROPERTY_TYPE.IO_LABEL]: Widgets.IOLabelWidget,
  },
};

const labelProp = {
  kind: 'property',
  mode: 'property',
  key: 'label',
  label: 'Label',
  type: 'string',
  value: '',
};
const pinProp = {
  kind: 'property',
  mode: 'property',
  key: 'pin',
  label: 'Pin',
  type: 'string',
  value: '',
};

class Inspector extends React.Component {
  constructor(props) {
    super(props);

    this.createWidgets(props);
  }

  componentWillUpdate(nextProps) {
    this.createWidgets(nextProps);
  }

  getProperties(nodeType) {
    const props = [labelProp];

    if (nodeType.category === 'hardware') {
      props.push(pinProp);
    }

    return props;
  }

  getInspectableProps(nodeType, node) {
    const props = this.getProperties(nodeType, node);
    let pins = [];

    if (nodeType.hasOwnProperty('pins')) {
      pins = R.pipe(
        R.filter(R.propEq('mode', 'property')),
        R.values,
        R.map((pin) => {
          if (
            node.hasOwnProperty('pins') &&
            node.pins.hasOwnProperty(pin.key)
          ) {
            return R.assoc('value', node.pins[pin.key].value, pin);
          }
          return pin;
        }),
        R.map(R.assoc('kind', 'pin'))
      )(nodeType.pins);
    }

    return R.concat(props, pins);
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
        const factory = React.createFactory(widgetAccordance[ENTITY.NODE][prop.type]);
        const disabled = (prop.mode !== 'property');

        widgets.push(
          factory({
            nodeId: node.id,
            key: `${node.id}_${prop.key}`,
            keyName: `${node.id}_${prop.key}`,
            label: prop.label,
            value: prop.value,
            mode: prop.mode,
            disabled,
            onPropUpdate: (newValue) => {
              this.props.onPropUpdate(node.id, prop.kind, prop.key, newValue);
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
};

Inspector.defaultProps = {
  selection: [],
  nodes: {},
  nodeTypes: {},
  onPropUpdate: f => f,
};

export default Inspector;
