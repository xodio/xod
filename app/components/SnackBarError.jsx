import React from 'react';

const ERROR_TIMEOUT = 3000;

class SnackBarError extends React.Component {
  constructor(props) {
    super(props);

    this.hide = this.hide.bind(this);
    this.onClick = this.onClick.bind(this);

    this.timer = 0;
    this.error = props.error;
  }

  componentDidMount() {
    this.refs.body.classList.remove('hide');

    this.timer = setTimeout(() => {
      this.hide();
    }, ERROR_TIMEOUT);
  }

  shouldComponentUpdate() {
    return false;
  }

  onClick() {
    this.hide();
  }

  hide() {
    this.refs.body.classList.add('hide');

    setTimeout(() => {
      this.props.onHide(this.error.timestamp);
    }, 500);
  }

  render() {
    const error = this.error;
    return (
      <li
        ref="body"
        className="SnackBar-Error hide"
        onClick={this.onClick}
      >
        <small>
          {error.timestamp}:
        </small>
        <br />
        {error.error.message}
      </li>
    );
  }
}

SnackBarError.propTypes = {
  error: React.PropTypes.object,
  onHide: React.PropTypes.func,
};

export default SnackBarError;
