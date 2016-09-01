import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { cookies, userInfo } from 'xod/client/cookies/selectors';

import { Icon } from 'react-fa';
import { LoginButton } from '../components/LoginButton';
import { UserButton } from '../components/UserButton';
import { UserMenu } from '../components/UserMenu';
import PopupForm from 'xod/client/utils/components/PopupForm';

import { ApiActions } from 'xod/client/api';

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
  }

  componentWillReceiveProps(props) {
    if (
      props.userInfo.user_id &&
      !props.userInfo.username &&
      !this.state.gettingUserInfo
    ) {
      this.updateState({ gettingUserInfo: true });
      this.props.actions.getData();
    }

    if (
      !props.userInfo.user_id ||
      props.userInfo.username
    ) {
      this.updateState({ gettingUserInfo: false });
    }
  }

  getButtons() {
    return [
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
      <div className="UserPanel UserPanel-unauthorized">
        <LoginButton onClick={this.showLoginPopup} />
        <PopupForm
          onClose={this.hideLoginPopup}
          isVisible={this.state.showLoginPopup}

          title="Sign in"
        >
          <div>
            Please, enter your username and password:
          </div>
          <div>
            Form here
          </div>
          <div>
            submit button here
          </div>
          <div>
            Forgot password here
          </div>
        </PopupForm>
      </div>
    );
  }

  getAuthorizedPanel(username) {
    return (
      <div className="UserPanel UserPanel-authorized">
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
      <div className="UserPanel UserPanel-loading">
        <Icon spin name="spinner" />
      </div>
    );
  }

  getPanel() {
    if (!this.props.userInfo || !this.props.userInfo.user_id) {
      return this.getUnauthorizedPanel();
    }

    if (this.props.userInfo.username) {
      return this.getAuthorizedPanel(this.props.userInfo.username);
    }

    return this.getLoadingPanel();
  }

  updateState(newState) {
    return this.setState(R.merge(this.state, newState));
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

  render() {
    return this.getPanel();
  }
}

UserPanel.propTypes = {
  userInfo: React.PropTypes.object,
  actions: React.PropTypes.object,
};

const mapStateToProps = state => {
  const cooks = cookies(state);

  return {
    userInfo: userInfo(cooks),
  };
};

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    login: ApiActions.profile.login,
    logout: ApiActions.profile.logout,
    getData: ApiActions.profile.me,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(UserPanel);
