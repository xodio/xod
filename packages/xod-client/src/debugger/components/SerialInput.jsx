import React from 'react';
import PropTypes from 'prop-types';

class SerialInput extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: '',
    };

    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onChange(e) {
    this.setState({
      value: e.target.value,
    });
  }

  onSubmit(e) {
    e.preventDefault();
    this.props.onSend(`${this.state.value}\r\n`);
    this.setState({
      value: '',
    });
  }

  render() {
    const { disabled } = this.props;

    return (
      <form className="SerialInput" autoComplete="off" onSubmit={this.onSubmit}>
        <input
          disabled={disabled}
          type="text"
          placeholder="Line to send via serial"
          onChange={this.onChange}
          value={this.state.value}
        />
        <button disabled={disabled} type="submit" className="send">
          ⮐
        </button>
      </form>
    );
  }
}

SerialInput.propTypes = {
  disabled: PropTypes.bool.isRequired,
  onSend: PropTypes.func.isRequired,
};

export default SerialInput;
