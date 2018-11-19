import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import urlParse from 'url-parse';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import EventListener from 'react-event-listener';
import { HotKeys } from 'react-hotkeys';

import * as XP from 'xod-project';
import client from 'xod-client';
import { foldEither, notNil } from 'xod-func-tools';

import packageJson from '../../package.json';
import PopupInstallApp from '../components/PopupInstallApp';

const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 600;

class App extends client.App {
  constructor(props) {
    super(props);

    this.menuRefs = {};

    this.state = {
      size: client.getViewableSize(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT),
      popupInstallApp: false,
      workspace: '',
    };

    this.onDocumentClick = this.onDocumentClick.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onUpload = this.onUpload.bind(this);
    this.onShowCodeArduino = this.onShowCodeArduino.bind(this);
    this.onOpenTutorial = this.onOpenTutorial.bind(this);
    this.onLoadChange = this.onLoadChange.bind(this);
    this.onLoad = this.onLoad.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onCloseApp = this.onCloseApp.bind(this);
    this.onCreateProject = this.onCreateProject.bind(this);

    this.hideInstallAppPopup = this.hideInstallAppPopup.bind(this);

    this.hotkeyHandlers = {
      [client.COMMAND.NEW_PROJECT]: this.onCreateProject,
      [client.COMMAND.UNDO]: this.props.actions.undoCurrentPatch,
      [client.COMMAND.REDO]: this.props.actions.redoCurrentPatch,
    };

    this.urlActions = {
      [client.URL_ACTION_TYPES.OPEN_TUTORIAL]: this.onOpenTutorial,
    };

    document.addEventListener('click', this.onDocumentClick);

    props.actions.openProject(props.tutorialProject);
    props.actions.fetchGrant();
  }

  onDocumentClick(e) {
    if (
      R.allPass([
        notNil,
        R.propEq('tagName', 'A'),
        R.propEq('protocol', client.URL_ACTION_PROTOCOL),
      ])(e.target)
    ) {
      const url = urlParse(e.target.href, true);

      if (url.hostname !== client.URL_ACTION_PREFIX) return;

      e.preventDefault();

      const actionName = url.pathname;
      const params = url.query;
      const action = this.urlActions[actionName];

      if (action) {
        action(params);
      } else {
        this.props.actions.addError(
          client.Messages.invalidUrlActionName(actionName)
        );
      }
    }
  }

  onResize() {
    this.setState(
      R.set(
        R.lensProp('size'),
        client.getViewableSize(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT),
        this.state
      )
    );
  }

  onCreateProject() {
    if (!this.confirmUnsavedChanges()) return;
    this.props.actions.createProject();
  }

  onUpload() {
    this.showInstallAppPopup();
  }

  onSave() {
    const { project } = this.props;

    const xodballJSON = XP.toXodball(project);
    const xodballName = XP.getProjectName(project);
    const link = document ? document.createElement('a') : null;
    const url = `data:application/xod;charset=utf8,${encodeURIComponent(
      xodballJSON
    )}`;

    if (link && link.download !== undefined) {
      link.href = url;
      link.setAttribute('download', `${xodballName}.xodball`);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(url, '_blank');
      window.focus();
    }
  }

  onLoadChange(event) {
    if (event.target.files.length === 0) return;

    const file = event.target.files[0];
    const reader = new window.FileReader();

    reader.onload = e => {
      this.onLoad(e.target.result);

      // drop the value of the file input to make possible to open
      // the project with the same path again
      this.menuRefs.openProject.value = '';
    };

    reader.readAsText(file);
  }

  onOpenTutorial() {
    if (!this.confirmUnsavedChanges()) return;

    this.props.actions.openProject(this.props.tutorialProject);
  }

  static onKeyDown(event) {
    const keyCode = event.keyCode || event.which;

    if (!client.isInputTarget(event) && keyCode === client.KEYCODE.BACKSPACE) {
      event.preventDefault();
    }

    return false;
  }

  onLoad(jsonString) {
    if (!this.confirmUnsavedChanges()) return;

    foldEither(
      this.props.actions.addError,
      this.props.actions.importProject,
      XP.fromXodball(jsonString)
    );
  }

  onCloseApp(event) {
    let message = true;

    if (this.props.hasUnsavedChanges) {
      message =
        'You have not saved changes in your project. Are you sure want to close app?';
      if (event) { event.returnValue = message; } // eslint-disable-line
    }

    return message;
  }

  getMenuBarItems() {
    const { items, onClick, submenu } = client.menu;

    const openProject = {
      key: items.openProject.key,
      click: event => {
        if (
          event.target === this.menuRefs.openProject ||
          event.target.parentNode === this.menuRefs.openProject.parentNode
        ) {
          return;
        }
        event.stopPropagation();
        this.menuRefs.openProject.click();
      },
      children: (
        <label key="import" className="load-button" htmlFor="openProjectButton">
          <input
            type="file"
            accept=".xodball"
            onChange={this.onLoadChange}
            id="openProjectButton"
            ref={input => {
              this.menuRefs.openProject = input;
            }}
          />
          <span>{items.openProject.label}</span>
        </label>
      ),
    };

    const link = (itemProps, componentProps) => ({
      key: itemProps.key,
      click: event => {
        if (event.target === this.menuRefs[itemProps.key]) return;
        event.stopPropagation();
        this.menuRefs[itemProps.key].click();
      },
      children: (
        <a
          className="menu-link"
          target="_blank"
          rel="noopener noreferrer"
          ref={el => {
            this.menuRefs[itemProps.key] = el;
          }}
          {...componentProps}
        >
          {itemProps.label}
        </a>
      ),
    });

    return [
      submenu(items.file, [
        onClick(items.newProject, this.onCreateProject),
        openProject,
        onClick(items.saveAs, this.onSave),
        items.separator,
        onClick(items.newPatch, this.props.actions.createPatch),
        items.separator,
        onClick(items.addLibrary, this.props.actions.showLibSuggester),
        onClick(items.publish, this.props.actions.requestPublishProject),
      ]),
      submenu(items.edit, [
        onClick(items.undo, this.props.actions.undoCurrentPatch),
        onClick(items.redo, this.props.actions.redoCurrentPatch),
        items.separator,
        onClick(items.selectall, this.props.actions.selectAll),
        items.separator,
        onClick(items.insertNode, () => this.props.actions.showSuggester(null)),
        onClick(items.insertComment, this.props.actions.addComment),
        items.separator,
        onClick(items.splitLinksToBuses, this.props.actions.splitLinksToBuses),
        items.separator,
        onClick(
          items.projectPreferences,
          this.props.actions.showProjectPreferences
        ),
      ]),
      submenu(items.deploy, [
        onClick(items.showCodeForArduino, this.onShowCodeArduino),
        onClick(items.uploadToArduino, this.onUpload),
      ]),
      submenu(items.view, [
        onClick(items.toggleProjectBrowser, () =>
          this.props.actions.togglePanel(client.PANEL_IDS.PROJECT_BROWSER)
        ),
        onClick(items.toggleInspector, () =>
          this.props.actions.togglePanel(client.PANEL_IDS.INSPECTOR)
        ),
        onClick(items.toggleHelp, this.props.actions.toggleHelp),
        onClick(items.toggleDebugger, this.props.actions.toggleDebugger),
        onClick(items.toggleAccountPane, () =>
          this.props.actions.togglePanel(client.PANEL_IDS.ACCOUNT)
        ),
        items.separator,
        onClick(
          items.panToOrigin,
          this.props.actions.setCurrentPatchOffsetToOrigin
        ),
        onClick(
          items.panToCenter,
          this.props.actions.setCurrentPatchOffsetToCenter
        ),
      ]),
      submenu(items.help, [
        {
          key: 'version',
          enabled: false,
          label: `Version: ${packageJson.version}`,
        },
        items.separator,
        onClick(items.openTutorialProject, this.onOpenTutorial),
        link(items.documentation, {
          href: client.getUtmSiteUrl('/docs/', 'docs', 'menu'),
        }),
        link(items.shortcuts, {
          href: client.getUtmSiteUrl(
            '/docs/reference/shortcuts/',
            'docs',
            'menu'
          ),
        }),
        link(items.forum, { href: client.getUtmForumUrl('menu') }),
      ]),
    ];
  }

  showInstallAppPopup() {
    this.setState({ popupInstallApp: true });
  }

  hideInstallAppPopup() {
    this.setState({ popupInstallApp: false });
  }

  confirmUnsavedChanges() {
    if (!this.props.hasUnsavedChanges) return true;

    // eslint-disable-next-line no-alert
    return confirm('Discard unsaved changes?');
  }

  render() {
    return (
      <HotKeys
        id="App"
        keyMap={client.menu.getOsSpecificHotkeys()}
        handlers={this.hotkeyHandlers}
      >
        <EventListener
          target={window}
          onResize={this.onResize}
          onKeyDown={this.constructor.onKeyDown}
          onBeforeUnload={this.onCloseApp}
        />
        <client.Toolbar menuBarItems={this.getMenuBarItems()} />
        <client.Editor
          size={this.state.size}
          onUploadClick={this.onUpload}
          onUploadAndDebugClick={this.onUpload}
        />
        <PopupInstallApp
          isVisible={this.state.popupInstallApp}
          onClose={this.hideInstallAppPopup}
        />
        {this.renderPopupShowCode()}
        {this.renderPopupProjectPreferences()}
        {this.renderPopupPublishProject()}
        {this.renderPopupCreateNewProject()}
      </HotKeys>
    );
  }
}

App.propTypes = R.merge(client.App.propTypes, {
  project: client.sanctuaryPropType(XP.Project),
  actions: PropTypes.object,
  tutorialProject: PropTypes.object.isRequired,
  popups: PropTypes.objectOf(PropTypes.bool),
  popupsData: PropTypes.objectOf(PropTypes.object),
});

const mapStateToProps = R.applySpec({
  hasUnsavedChanges: client.hasUnsavedChanges,
  project: client.getProject,
  user: client.getUser,
  currentPatchPath: client.getCurrentPatchPath,
  popups: {
    createProject: client.getPopupVisibility(client.POPUP_ID.CREATING_PROJECT),
    showCode: client.getPopupVisibility(client.POPUP_ID.SHOWING_CODE),
    projectPreferences: client.getPopupVisibility(
      client.POPUP_ID.EDITING_PROJECT_PREFERENCES
    ),
    publishingProject: client.getPopupVisibility(
      client.POPUP_ID.PUBLISHING_PROJECT
    ),
  },
  popupsData: {
    showCode: client.getPopupData(client.POPUP_ID.SHOWING_CODE),
    publishingProject: client.getPopupData(client.POPUP_ID.PUBLISHING_PROJECT),
  },
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(
    R.merge(client.App.actions, {
      // Put custom actions for xod-client-browser here
    }),
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
