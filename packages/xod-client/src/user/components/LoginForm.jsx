import React from 'react';
import Formsy from 'formsy-react';
import FormsyComponent from 'formsy-react-components';

import PopupForm from '../../utils/components/PopupForm';

class LoginForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      canSubmit: false,
    };

    this.enableSubmit = this.enableSubmit.bind(this);
    this.disableSubmit = this.disableSubmit.bind(this);
  }

  enableSubmit() {
    this.setState({
      canSubmit: true,
    });
  }
  disableSubmit() {
    this.setState({
      canSubmit: false,
    });
  }

  render() {
    return (
      <PopupForm
        className="LoginForm"
        onClose={this.props.onClose}
        isVisible={this.props.isVisible}

        title="Sign in"
      >
        <div>
          Please, enter your username and password:
        </div>
        <Formsy.Form
          onValidSubmit={this.props.onSubmit}
          onValid={this.enableSubmit}
          onInvalid={this.disableSubmit}
        >
          <FormsyComponent.Input
            name="username"
            label="Username"
            type="text"
            validations="isExisty"
            autoFocus
          />
          <FormsyComponent.Input
            name="password"
            label="Password"
            type="password"
            validations="minLength:6"
          />
          <button
            className="LoginFormSubmit"
            type="submit"
            disabled={!this.state.canSubmit}
          >
            Sign in!
          </button>
        </Formsy.Form>
        <div>
          Forgot password here
        </div>
      </PopupForm>
    );
  }
}

LoginForm.propTypes = {
  onClose: React.PropTypes.func,
  onSubmit: React.PropTypes.func,
  isVisible: React.PropTypes.bool,
};

export default LoginForm;
