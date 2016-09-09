import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { getProject, getMeta, getServerId, getProjectPojo } from 'xod-client/project/selectors';
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
      panel: 'unauth',
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

  componentWillReceiveProps(props) {
    if (!props.userId) {
      this.closeMenu();
      return this.setPanel('unauth');
    }

    if (props.username) {
      this.hideLoginPopup();
      return this.setPanel('auth');
    }

    return this.setPanel('loading');
  }

  getButtons() {
    const canSave = this.canSave();
    const canLoad = this.canLoad();

    return [
      {
        name: 'save',
        icon: 'cloud-upload',
        text: 'Save project in cloud',
        active: canSave,
        onClick: this.saveProject,
      },
      {
        name: 'load',
        icon: 'cloud-download',
        text: 'Load project from cloud',
        active: canLoad,
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
    switch (this.state.panel) {
      default:
      case 'unath':
        return this.getUnauthorizedPanel();
      case 'auth':
        return this.getAuthorizedPanel(this.props.username);
      case 'loading':
        return this.getLoadingPanel();
    }
  }

  setPanel(panelName) {
    return this.setState({ panel: panelName });
  }

  saveProject() {
    this.props.actions.save(this.props.projectPojo);
  }

  loadProject() {
    if (this.props.currentProjectId) {
      this.props.actions.load(this.props.currentProjectId);
    }
  }

  openMenu() {
    this.setState({
      menuOpened: true,
    });
  }
  closeMenu() {
    this.setState({
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
    this.setState({
      showLoginPopup: true,
    });
  }

  hideLoginPopup() {
    this.setState({
      showLoginPopup: false,
    });
  }

  submitLogin(model) {
    this.props.actions.login(model.username, model.password);
  }

  compareServerAndPojo() {
    return (
      this.props.lastSyncProject &&
      this.props.lastSyncProject.pojo === JSON.stringify(this.props.projectPojo)
    );
  }

  canSave() {
    return !this.compareServerAndPojo();
  }

  canLoad() {
    return (this.props.currentProjectId && !this.compareServerAndPojo());
  }

  render() {
    return this.getPanel();
  }
}

UserPanel.propTypes = {
  project: React.PropTypes.object,
  currentProjectId: React.PropTypes.number,
  projectPojo: React.PropTypes.object,
  lastSyncProject: React.PropTypes.object,
  userId: React.PropTypes.string,
  username: React.PropTypes.string,
  userpic: React.PropTypes.string,
  actions: React.PropTypes.object,
};

const mapStateToProps = state => {
  const userData = user.user(state);
  const userProjects = user.projects(userData) || {};
  const project = getProject(state);
  const meta = getMeta(project);
  const curProjectId = getServerId(meta);

  return {
    currentProjectId: curProjectId,
    projectPojo: getProjectPojo(state),
    lastSyncProject: userProjects[curProjectId],
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
