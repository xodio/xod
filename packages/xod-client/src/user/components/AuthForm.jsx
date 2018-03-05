import React from 'react';
import PropTypes from 'prop-types';

import { getAuthFormUrl, getPasswordResetUrl } from '../../utils/urls';

import Button from '../../core/components/Button';

class AuthForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      username: '',
      password: '',
    };

    this.onUsernameChange = this.onUsernameChange.bind(this);
    this.onPasswordChange = this.onPasswordChange.bind(this);
    this.onLogin = this.onLogin.bind(this);
  }

  onUsernameChange(e) {
    this.setState({ username: e.target.value });
  }

  onPasswordChange(e) {
    this.setState({ password: e.target.value });
  }

  onLogin(event) {
    event.preventDefault();
    this.props.onLogin(this.state.username, this.state.password);
  }

  render() {
    const { isAuthorising } = this.props;
    const { username, password } = this.state;

    return (
      <form onSubmit={this.onLogin}>
        <div className="whyLogin">
          Log in to increase quotas and access more features
        </div>

        <input
          className="inspectorInput inspectorInput--full-width"
          type="text"
          placeholder="username or email"
          value={username}
          onChange={this.onUsernameChange}
        />

        <input
          className="inspectorInput inspectorInput--full-width"
          placeholder="password"
          type="password"
          value={password}
          onChange={this.onPasswordChange}
        />

        <a
          className="forgotPassword"
          href={getPasswordResetUrl()}
          target="_blank"
          rel="noopener noreferrer"
        >
          Forgot password
        </a>

        <div className="ButtonsRow">
          <Button light disabled={isAuthorising}>
            Log In
          </Button>
          <Button
            as="a"
            target="_blank"
            rel="noopener noreferrer"
            href={getAuthFormUrl()}
          >
            Sign Up
          </Button>
        </div>
      </form>
    );
  }
}

AuthForm.propTypes = {
  onLogin: PropTypes.func.isRequired,
  isAuthorising: PropTypes.bool.isRequired,
};

export default AuthForm;
