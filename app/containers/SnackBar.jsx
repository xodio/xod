import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import Selectors from '../selectors';
import { hideError } from '../actions';

const ERROR_TIMEOUT = 3000;

const styles = {
  container: {
    position: 'fixed',
    zIndex: 10,
    bottom: 0,
    right: 0,
    width: '200px',
  },
  error: {
    display: 'block',
    marginTop: '1px',
    padding: '8px 16px',
    color: '#fff',
    background: '#600',
    borderBottom: '1px solid #400',
    transition: 'all 0.5s ease-in',
  },
};

class SnackBar extends React.Component {
  constructor(props) {
    super(props);
    this.timers = {};
    this.onClick = (timestamp) => this.hideError.bind(this, timestamp);
  }
  componentWillReceiveProps(nextProps) {
    nextProps.errors.forEach((error) => {
      if (!this.timers.hasOwnProperty(error.timestamp)) {
        setTimeout(() => {
          this.hideError(error.timestamp);
        }, ERROR_TIMEOUT);
      }
    });
  }
  hideError(timestamp) {
    if (this.timers.hasOwnProperty(timestamp)) {
      clearTimeout(this.timer[timestamp]);
    }
    this.props.hideError(timestamp);
  }
  render() {
    return (
      <div>
        <ul style={styles.container}>
          {this.props.errors.map((error, i) =>
            <li
              key={i}
              onClick={this.onClick(error.timestamp)}
              style={styles.error}
            >
              <small>
                {error.timestamp}:
              </small>
              <br />
              {error.error.message}
            </li>
          )}
        </ul>
      </div>
    );
  }
}


SnackBar.propTypes = {
  errors: React.PropTypes.array,
  hideError: React.PropTypes.func,
};

const mapStateToProps = (state) => ({
  errors: Selectors.Errors.getErrors(state),
});

const mapDispatchToProps = (dispatch) => (bindActionCreators({ hideError }, dispatch));

export default connect(mapStateToProps, mapDispatchToProps)(SnackBar);
