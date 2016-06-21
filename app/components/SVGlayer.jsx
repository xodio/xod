import React from 'react';

class SVGLayer extends React.Component {
    constructor(props) {
        super(props);
        this.displayName = 'SVGLayer';
    }
    render() {
      return (
        <g id={this.props.name}>
          {this.props.childs}
        </g>
      );
    }
}

export default SVGLayer;