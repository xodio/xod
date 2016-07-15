import React from 'react';
import Widgets from './InspectorWidgets';
import * as ENTITIES from '../constants/entities';

const styles = {
  container: {
    position: 'absolute',
    width: '200px',
    height: '100%',
    background: '#eee',
    color: '#000',
  },
  title: {
    display: 'block',
    padding: '26px 20px 4px 8px',
    color: '#999',
  },
  ul: {
    padding: 0,
    margin: 0,
    listStyleType: 'none',
  },
  li: {
    padding: '4px 8px',
    margin: '1px 0',
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

  createWidgets(props) {
    const selection = props.selection;

    if (selection.length === 0) {
      this.widgets = [
        new Widgets.HintWidget({
          text: 'Select a node to edit its properties.',
        }),
      ];
    } else if (selection.length === 1) {
      const entity = (selection[0].entity);
      switch (entity) {
        case ENTITIES.NODE:
          this.widgets = [
            new Widgets.HintWidget({
              text: 'There are no properties for the selected node.',
            }),
          ];
          break;
        case ENTITIES.LINK:
          this.widgets = [
            new Widgets.HintWidget({
              text: 'Links have not any properties.',
            }),
          ];
          break;
        default:
          this.widgets = [];
          break;
      }
    } else {
      this.widgets = [
        new Widgets.HintWidget({
          text: `You have selected: ${selection.length} elements.`,
        }),
      ];
    }
  }

  render() {
    return (
      <div style={styles.container}>
        <small style={styles.title}>Inspector</small>
        <ul style={styles.ul}>
          {this.widgets.map((widget, i) =>
            <li key={i} style={styles.li}>
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
  nodeTypes: React.PropTypes.object,
  onPropUpdate: React.PropTypes.func,
};

Inspector.defaultProps = {
  selection: [],
  nodeTypes: {},
  onPropUpdate: f => f,
};

export default Inspector;
