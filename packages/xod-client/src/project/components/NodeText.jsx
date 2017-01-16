import React from 'react';

class NodeText extends React.Component {
  constructor(props) {
    super(props);

    this.label = null;
  }
  componentDidMount() {
    this.labelBbox = this.getBbox();
    this.forceUpdate();
  }

  componentDidUpdate() {
    this.labelBbox = this.getBbox();
  }

  getBbox() {
    if (this.label) {
      return this.label.getBBox();
    }

    return { width: 0, height: 0 };
  }

  getWidth() {
    return this.labelBbox.width;
  }

  getHeight() {
    return this.labelBbox.height;
  }

  getPosition() {
    const position = {
      x: this.props.position.x,
      y: this.props.position.y,
    };

    if (this.labelBbox) {
      const line = this.labelBbox;
      const yCorrection = Math.round(line.height / 4);
      position.y += yCorrection;
    }

    return position;
  }

  render() {
    const assignLabelRef = (ref) => { this.label = ref; };

    return (
      <text
        className="NodeText"
        {...this.getPosition()}
        textAnchor="middle"
        ref={assignLabelRef}
      >
        {this.props.label}
      </text>
    );
  }
}

NodeText.propTypes = {
  position: React.PropTypes.any,
  label: React.PropTypes.string.isRequired,
};

export default NodeText;
