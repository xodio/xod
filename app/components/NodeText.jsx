import React from 'react';

class NodeText extends React.Component {
  componentDidMount() {
    const line = this.getBbox();
    const yCorrection = Math.round(line.height / 4);

    this.position = {
      x: this.props.position.x,
      y: this.props.position.y + yCorrection,
    };

    this.forceUpdate();
  }
  getBbox() {
    return this.refs.label.getBBox();
  }
  render() {
    const style = this.props.style;

    return (
      <text
        {...this.position}
        style={style}
        textAnchor="middle"
        ref="label"
      >
        {this.props.label}
      </text>
    );
  }
}

NodeText.propTypes = {
  position: React.PropTypes.any,
  style: React.PropTypes.any,
  label: React.PropTypes.string.isRequired,
};

export default NodeText;
