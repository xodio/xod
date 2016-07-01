import React from 'react';

class NodeText extends React.Component {
  componentDidMount() {
    const line = this.getLineBbox();
    const yCorrection = (this.props.label) ?
      Math.round(line.height / 9) * -1 :
      Math.round(line.height / 4);

    this.position = {
      x: this.props.position.x,
      y: this.props.position.y + yCorrection,
    };

    this.forceUpdate();
  }
  getBbox() {
    return this.refs.text.getBBox();
  }
  getLineBbox() {
    return this.refs.line.getBBox();
  }
  render() {
    const style = this.props.style;

    return (
      <text style={style} ref="text">
        <tspan
          {...this.position}
          textAnchor="middle"
          ref="line"
        >
          {this.props.typeLabel}
        </tspan>
        <tspan
          {...this.position}
          textAnchor="middle"
          dy="1.2em"
        >
          {this.props.label}
        </tspan>
      </text>
    );
  }
}

NodeText.propTypes = {
  position: React.PropTypes.any,
  style: React.PropTypes.any,
  typeLabel: React.PropTypes.string.isRequired,
  label: React.PropTypes.string,
};

export default NodeText;
