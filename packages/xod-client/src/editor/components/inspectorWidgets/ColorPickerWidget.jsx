import React from 'react';
import PropTypes from 'prop-types';

import PointingPopup from '../PointingPopup';
import ColorPicker from '../ColorPicker';
import colorPropType from '../ColorPicker/colorPropType';

class ColorPickerWidget extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      color: props.color,
    };

    this.onChange = this.onChange.bind(this);
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.color.hex !== this.props.color.hex &&
      this.state.color.hex !== this.props.color.hex
    ) {
      // Update the color stored in the state only if it changed
      // outside the ColorPicker.
      // E.G. user types the new hex color in the input.
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ color: this.props.color });
    }
  }

  onChange(color) {
    this.setState({ color });
    this.props.onChange(color);
  }

  render() {
    return (
      <PointingPopup
        className="ColorPickerWidget"
        isVisible={this.props.isVisible}
        selectorPointingAt={this.props.selectorPointingAt}
        hidePopup={this.props.onClose}
      >
        <ColorPicker
          widgetId={this.props.widgetId}
          color={this.state.color}
          onChange={this.onChange}
        />
      </PointingPopup>
    );
  }
}

ColorPickerWidget.propTypes = {
  color: colorPropType,
  isVisible: PropTypes.bool.isRequired,
  selectorPointingAt: PropTypes.string,
  widgetId: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ColorPickerWidget;
