import R from 'ramda';
import React from 'react';
import Widgets from './inspectorWidgets';
import { ENTITY, PROPERTY_TYPE } from 'xod-client/project/constants';

const widgetAccordance = {
  [ENTITY.NODE]: {
    [PROPERTY_TYPE.BOOL]: Widgets.BoolWidget,
    [PROPERTY_TYPE.NUMBER]: Widgets.NumberWidget,
    [PROPERTY_TYPE.STRING]: Widgets.StringWidget,
    [PROPERTY_TYPE.IO_LABEL]: Widgets.IOLabelWidget,
  },
};

class Inspector extends React.Component {
  constructor(props) {
    super(props);

    this.createWidgets(props);
  }

  componentWillUpdate(nextProps) {
    this.createWidgets(nextProps);
  }

  getProperties(nodeType, node) {
    let props = [];

    if (nodeType.hasOwnProperty('properties')) {
      props = R.pipe(
        R.values,
        R.map((prop) => {
          const merged = R.clone(prop);
          if (
            node.hasOwnProperty('properties') &&
            node.properties.hasOwnProperty(prop.key)
          ) {
            merged.value = node.properties[prop.key];
          }
          return merged;
        })
      )(nodeType.properties);
    }
    return props;
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
    const properties = this.getProperties(nodeType, node);

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
        widgets.push(
          factory({
            nodeId: node.id,
            key: `${node.id}_${prop.key}`,
            keyName: `${node.id}_${prop.key}`,
            label: prop.label,
            value: prop.value,
            onPropUpdate: (newValue) => {
              this.props.onPropUpdate(node.id, prop.key, newValue);
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
