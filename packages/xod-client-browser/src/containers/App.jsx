import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { HotKeys } from 'react-hotkeys';

import core from 'xod-core';
import client from 'xod-client';

import { espruino, nodejs } from 'xod-js';

import PopupInstallApp from '../components/PopupInstallApp';
import EventListener from 'react-event-listener';

const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 600;

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      size: client.getViewableSize(DEFAULT_CANVAS_WIDTH, DEFAULT_CANVAS_HEIGHT),
      popupInstallApp: false,
      popupUploadProject: false,
      popupShowCode: false,
      popupCreateProject: false,
      code: '',
    };

    this.isElectronApp = (window && window.process && window.process.type);

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onUpload = this.onUpload.bind(this);
    this.onShowCodeEspruino = this.onShowCodeEspruino.bind(this);
    this.onShowCodeNodejs = this.onShowCodeNodejs.bind(this);
    this.onImportChange = this.onImportChange.bind(this);
    this.onImport = this.onImport.bind(this);
    this.onExport = this.onExport.bind(this);
    this.onSelectNodeType = this.onSelectNodeType.bind(this);
    this.onAddNodeClick = this.onAddNodeClick.bind(this);
    this.onCloseApp = this.onCloseApp.bind(this);
    this.onCreateProject = this.onCreateProject.bind(this);

    this.hideInstallAppPopup = this.hideInstallAppPopup.bind(this);
    this.hideCodePopup = this.hideCodePopup.bind(this);
    this.showPopupCreateProject = this.showPopupCreateProject.bind(this);
    this.hidePopupCreateProject = this.hidePopupCreateProject.bind(this);
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

  onCreateProject(projectName) {
    this.props.actions.createProject(projectName);
    this.hidePopupCreateProject();
  }

  onUpload() {
    this.showInstallAppPopup();
  }

  onShowCodeEspruino() {
    this.setState({
      code: espruino(this.props.project),
    });
    this.showCodePopup();
  }

  onShowCodeNodejs() {
    this.setState({
      code: nodejs(this.props.project),
    });
    this.showCodePopup();
  }

  onImportChange(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      this.onImport(e.target.result);
    };

    reader.readAsText(file);
  }

  onImport(json) {
    let project;
    let validJSON = true;
    let errorMessage = null;

    try {
      project = JSON.parse(json);
    } catch (err) {
      validJSON = false;
      errorMessage = client.SAVE_LOAD_ERRORS.NOT_A_JSON;
    }

    if (validJSON && !core.validateProject(project)) {
      errorMessage = client.SAVE_LOAD_ERRORS.INVALID_FORMAT;
    }

    if (errorMessage) {
      this.props.actions.addError({
        message: errorMessage,
      });
      return;
    }

    this.props.actions.loadProjectFromJSON(json);
  }

  onExport() {
    const projectName = this.props.meta.name;
    const link = (document) ? document.createElement('a') : null;
    const url = `data:application/xod;charset=utf8,${encodeURIComponent(this.props.projectJSON)}`;

    if (link && link.download !== undefined) {
      link.href = url;
      link.setAttribute('download', `${projectName}.xodball`);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(url, '_blank');
      window.focus();
    }
  }

  onSelectNodeType(typeKey) {
    this.props.actions.setSelectedNodeType(typeKey);
  }

  onAddNodeClick() {
    this.props.actions.setMode(client.EDITOR_MODE.CREATING_NODE);
  }

  onKeyDown(event) {
    const keyCode = event.keyCode || event.which;

    if (!client.isInputTarget(event) && keyCode === client.KEYCODE.BACKSPACE) {
      event.preventDefault();
    }

    return false;
  }

  onElectronClose() {
    // @TODO
    return true;
  }

  onBrowserClose(event) {
    let message = true;

    if (this.props.hasChanges) {
      message = 'You have not saved changes in your project. Are you sure want to close app?';
      if (event) { event.returnValue = message; } // eslint-disable-line
    }

    return message;
  }

  onCloseApp(event) {
    if (this.isElectronApp) {
      return this.onElectronClose(event);
    }

    return this.onBrowserClose(event);
  }

  getToolbarLoadElement() {
    return (
      <label
        key="import"
        className="load-button"
      >
        <input
          type="file"
          accept=".xodball"
          onChange={this.onImportChange}
        />
        <span>
          Import project
        </span>
      </label>
    );
  }

  getToolbarButtons() {
    return [
      {
        key: 'upload',
        className: 'upload-button',
        label: 'Upload',
        onClick: this.onUpload,
      },
      {
        key: 'show-code-espruino',
        className: 'show-code-button',
        label: 'Show code for Espruino',
        onClick: this.onShowCodeEspruino,
      },
      {
        key: 'show-code-nodejs',
        className: 'show-code-button',
        label: 'Show code for Nodejs',
        onClick: this.onShowCodeNodejs,
      },
      {
        key: 'export',
        className: 'save-button',
        label: 'Export project',
        onClick: this.onExport,
      },
      this.getToolbarLoadElement(),
      {
        key: 'newProject',
        className: 'upload-button',
        label: 'Create new project',
        onClick: this.showPopupCreateProject,
      },
    ];
  }

  showInstallAppPopup() {
    this.setState({ popupInstallApp: true });
  }

  hideInstallAppPopup() {
    this.setState({ popupInstallApp: false });
  }

  showUploadProgressPopup() {
    this.setState({ popupUploadProject: true });
  }

  hideUploadProgressPopup() {
    this.setState({ popupUploadProject: false });
  }

  showCodePopup() {
    this.setState({ popupShowCode: true });
  }

  hideCodePopup() {
    this.setState({ popupShowCode: false });
  }

  showPopupCreateProject() {
    this.setState({ popupCreateProject: true });
  }

  hidePopupCreateProject() {
    this.setState({ popupCreateProject: false });
  }

  render() {
    const devToolsInstrument = (client.isChromeApp) ? <client.DevTools /> : null;
    return (
      <HotKeys keyMap={client.HOTKEY} id="App">
        <EventListener
          target={window}
          onResize={this.onResize}
          onKeyDown={this.onKeyDown}
          onBeforeUnload={this.onCloseApp}
        />
        <client.Toolbar
          meta={this.props.meta}
          nodeTypes={this.props.nodeTypes}
          onSelectNodeType={this.onSelectNodeType}
          onAddNodeClick={this.onAddNodeClick}
          buttons={this.getToolbarButtons()}
        />
        <client.Editor size={this.state.size} />
        <client.SnackBar />
        {devToolsInstrument}
        <PopupInstallApp
          isVisible={this.state.popupInstallApp}
          onClose={this.hideInstallAppPopup}
        />
        <client.PopupShowCode
          isVisible={this.state.popupShowCode}
          code={this.state.code}
          onClose={this.hideCodePopup}
        />
        <client.PopupPrompt
          title="Create new project"
          confirmText="Create project"
          isVisible={this.state.popupCreateProject}
          onConfirm={this.onCreateProject}
          onClose={this.hidePopupCreateProject}
        >
          <p>
          Please, give a sonorous name to yor project:
          </p>
        </client.PopupPrompt>
      </HotKeys>
    );
  }
}

App.propTypes = {
  hasChanges: React.PropTypes.bool,
  project: React.PropTypes.object,
  projectJSON: React.PropTypes.string,
  meta: React.PropTypes.object,
  nodeTypes: React.PropTypes.any.isRequired,
  selectedNodeType: React.PropTypes.string,
  actions: React.PropTypes.object,
};

const mapStateToProps = (state) => ({
  hasChanges: client.projectHasChanges(state),
  project: core.getProjectPojo(state),
  projectJSON: core.getProjectJSON(state),
  meta: core.getMeta(state),
  nodeTypes: core.dereferencedNodeTypes(state),
  selectedNodeType: client.getSelectedNodeType(state),
});

const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators({
    createProject: client.createProject,
    loadProjectFromJSON: client.loadProjectFromJSON,
    setMode: client.setMode,
    addError: client.addError,
    setSelectedNodeType: client.setSelectedNodeType,
    deleteProcess: client.deleteProcess,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
