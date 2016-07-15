import React from 'react';
import Widgets from './InspectorWidgets';

const styles = {
  container: {
    float: 'left',
    width: '200px',
    background: '#fff',
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

    this.widgets = [];
  }

  componentWillUpdate(nextProps) {
    if (nextProps.selection.length === 0) {
      this.widgets = [
        new Widgets.HintWidget({
          text: 'Select the node to edit its properties.',
        }),
      ];
    } else {
      this.widgets = [
        new Widgets.HintWidget({
          text: 'There is no properties.',
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
