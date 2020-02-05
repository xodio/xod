import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import * as Actions from '../actions';
import {
  isColorPickerWidgetVisible,
  getColorPickerWidgetElementId,
} from '../selectors';

import PointingPopup from '../components/PointingPopup';
import ColorPicker from '../components/ColorPicker';
import colorPropType from '../components/ColorPicker/colorPropType';

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
        selectorPointingAt={this.props.widgetId}
        hidePopup={this.props.actions.hideColorPickerWidget}
      >
        <ColorPicker color={this.state.color} onChange={this.onChange} />
      </PointingPopup>
    );
  }
}

ColorPickerWidget.propTypes = {
  color: colorPropType,
  isVisible: PropTypes.bool.isRequired,
  widgetId: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  actions: PropTypes.shape({
    // eslint-disable-next-line react/no-unused-prop-types
    hideColorPickerWidget: PropTypes.func.isRequired,
  }),
};

const mapStateToProps = R.applySpec({
  isVisible: isColorPickerWidgetVisible,
  widgetId: getColorPickerWidgetElementId,
});
const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(
    {
      hideColorPickerWidget: Actions.hideColorPickerWidget,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(ColorPickerWidget);
