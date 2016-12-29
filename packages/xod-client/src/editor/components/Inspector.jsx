import R from 'ramda';
import React from 'react';
import Widgets, { WIDGET_MAPPING, DEFAULT_NODE_PROPS } from './inspectorWidgets';
import { noop } from '../../utils/ramda';
import { ENTITY } from 'xod-core';

const indexByKey = R.indexBy(R.prop('key'));

// :: defaultNodeProps -> inspectorProp[] -> inspectorProp[]
const extendNodeProps = R.compose(
  R.values,
  R.useWith(
    R.merge,
    [
      indexByKey,
      indexByKey,
    ]
  )
);

class Inspector extends React.Component {
  constructor(props) {
    super(props);

    this.createWidgets(props);
  }

  // shouldComponentUpdate(nextProps) {
    // const oldSelection = this.props.selection;
    // const newSelection = nextProps.selection;
    // const sameSelection = R.equals(oldSelection, newSelection);
    //
    // if (sameSelection && (newSelection.length === 0 || newSelection > 1)) { return false; }
    //
    // if (sameSelection && newSelection.length === 1) {
    //   const selection = newSelection[0];
    //   const entity = selection.entity;
    //   if (entity === ENTITY.LINK) return false;
    //   if (entity === ENTITY.NODE) {
    //     const oldNode = this.props.nodes[selection.id];
    //     const newNode = nextProps.nodes[selection.id];
    //     const sameNodes = R.equals(oldNode, newNode);
    //     if (sameNodes) return false;
    //   }
    // }
    //
    // return true;
  // }

  componentWillUpdate(nextProps) {
    this.createWidgets(nextProps);
  }

  createWidgets(props) {
    const selection = props.data;
    if (selection.length === 0) {
      this.createEmptySelectionWidgets();
    } else if (selection.length === 1) {
      const entity = (selection[0].entity);
      switch (entity) {
        case ENTITY.NODE: {
          this.createNodeWidgets(selection[0]);
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

  createNodeWidgets(selection) {
    const nodeId = selection.id;
    const properties = extendNodeProps(DEFAULT_NODE_PROPS, selection.props);

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
            WIDGET_MAPPING[ENTITY.NODE][widgetType].component,
            WIDGET_MAPPING[ENTITY.NODE][widgetType].props
          )
        );
        const injected = prop.injected || false;

        widgets.push(
          factory({
            key: `${nodeId}_${prop.key}`,
            keyName: `${nodeId}_${prop.key}`,
            kind: prop.kind,
            label: prop.label,
            value: prop.value,
            injected,
            onPropUpdate: (newValue) => {
              this.props.onPropUpdate(nodeId, prop.kind, prop.key, newValue);
            },
            onPinModeSwitch: () => {
              const newInjected = !injected;
              const val = (newInjected) ? prop.value : null;

              this.props.onPinModeSwitch(nodeId, prop.key, newInjected, val);
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
