import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { getProjectPojo } from 'xod-client/project/selectors';
import * as user from '../selectors';

import { Icon } from 'react-fa';
import { LoginButton } from '../components/LoginButton';
import { LoginForm } from '../components/LoginForm';
import { UserButton } from '../components/UserButton';
import { UserMenu } from '../components/UserMenu';

import { ApiActions } from 'xod-client/api';

class UserPanel extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      gettingUserInfo: false,
      menuOpened: false,
      showLoginPopup: false,
    };

    this.openMenu = this.openMenu.bind(this);
    this.closeMenu = this.closeMenu.bind(this);
    this.toggleMenu = this.toggleMenu.bind(this);

    this.showLoginPopup = this.showLoginPopup.bind(this);
    this.hideLoginPopup = this.hideLoginPopup.bind(this);

    this.submitLogin = this.submitLogin.bind(this);
    this.saveProject = this.saveProject.bind(this);
    this.loadProject = this.loadProject.bind(this);
  }

  getButtons() {
    return [
      {
        name: 'save',
        icon: 'cloud-upload',
        text: 'Save project in cloud',
        onClick: this.saveProject,
      },
      {
        name: 'load',
        icon: 'cloud-download',
        text: 'Load project from cloud',
        onClick: this.loadProject,
      },
      {
        name: 'logout',
        icon: 'sign-out',
        text: 'Sign out',
        onClick: this.props.actions.logout,
      },
    ];
  }

  getUnauthorizedPanel() {
    return (
      <div className="UserPanel unauthorized">
        <LoginButton onClick={this.showLoginPopup} />
        <LoginForm
          onClose={this.hideLoginPopup}
          isVisible={this.state.showLoginPopup}
          onSubmit={this.submitLogin}
        />
      </div>
    );
  }

  getAuthorizedPanel(username) {
    return (
      <div className="UserPanel authorized">
        <UserButton
          username={username}
          onClick={this.toggleMenu}
        />
        <UserMenu
          opened={this.state.menuOpened}
          buttons={this.getButtons()}
        />
      </div>
    );
  }

  getLoadingPanel() {
    return (
      <div className="UserPanel loading">
        <Icon spin name="spinner" />
      </div>
    );
  }

  getPanel() {
    if (!this.props.userId) {
      return this.getUnauthorizedPanel();
    }

    if (this.props.username) {
      return this.getAuthorizedPanel(this.props.username);
    }

    return this.getLoadingPanel();
  }

  updateState(newState) {
    return this.setState(R.merge(this.state, newState));
  }

  saveProject() {
    this.props.actions.save(this.props.projectPojo);
  }

  loadProject() {
    this.props.actions.load('57cd837ea951160b31c98f37');
  }

  openMenu() {
    this.updateState({
      menuOpened: true,
    });
  }
  closeMenu() {
    this.updateState({
      menuOpened: false,
    });
  }
  toggleMenu() {
    if (this.state.menuOpened) {
      return this.closeMenu();
    }

    return this.openMenu();
  }

  showLoginPopup() {
    this.updateState({
      showLoginPopup: true,
    });
  }

  hideLoginPopup() {
    this.updateState({
      showLoginPopup: false,
    });
  }

  submitLogin(model) {
    this.props.actions.login(model.username, model.password);
  }

  render() {
    return this.getPanel();
  }
}

UserPanel.propTypes = {
  projectPojo: React.PropTypes.object,
  userId: React.PropTypes.string,
  username: React.PropTypes.string,
  userpic: React.PropTypes.string,
  actions: React.PropTypes.object,
};

const mapStateToProps = state => {
  const userData = user.user(state);
  return {
    projectPojo: getProjectPojo(state),
    userId: user.userId(userData),
    username: user.username(userData),
    userpic: user.userpic(userData),
  };
};

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    login: ApiActions.user.login,
    logout: ApiActions.user.logout,
    save: ApiActions.project.save,
    load: ApiActions.project.load,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(UserPanel);
