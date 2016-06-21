import React from 'react'
import R from 'ramda'
import Pin from '../components/Pin.jsx'

class PinList extends React.Component {
    constructor(props) {
        super(props);
        this.displayName = 'PinList';
    }
    render() {
      const pins = R.values(this.props.pins);
      return (
        <g className="pinlist">
          {pins.map( (pin) =>
            <Pin key={pin.id} data={pin} viewState={this.props.viewState[pin.id]} style={this.props.style} />
          )}
        </g>
      );
    }
}

export default PinList;