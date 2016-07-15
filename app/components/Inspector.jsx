import React from 'react';

const styles = {
  container: {
    float: 'left',
    width: '200px',
    background: '#fff',
    color: '#000',
  },
  title: {
    display: 'block',
    padding: '26px 20px 10px 20px',
  },
  ul: {
    padding: '0px',
    margin: '10px 0 0 0',
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
    this.displayName = 'Inspector';

    this.widgets = [];
  }

  render() {
    return (
      <div style={styles.container}>
        <small style={styles.title}>Inspector</small>
        <ul style={styles.ul}>
          {this.widgets.map(widget =>
            <li style={styles.li}>
              {widget.name}
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
