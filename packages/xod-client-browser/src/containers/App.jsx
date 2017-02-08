import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import EventListener from 'react-event-listener';
import { HotKeys } from 'react-hotkeys';

import core from 'xod-core';
import client from 'xod-client';
import { transpileForEspruino, transpileForNodeJS } from 'xod-js';

import PopupInstallApp from '../components/PopupInstallApp';

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
      code: transpileForEspruino(this.props.project),
    });
    this.showCodePopup();
  }

  onShowCodeNodejs() {
    this.setState({
      code: transpileForNodeJS(this.props.project),
    });
    this.showCodePopup();
  }

  onImportChange(event) {
    const file = event.target.files[0];
    const reader = new window.FileReader();

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

  onKeyDown(event) {  // eslint-disable-line class-methods-use-this
    const keyCode = event.keyCode || event.which;

    if (!client.isInputTarget(event) && keyCode === client.KEYCODE.BACKSPACE) {
      event.preventDefault();
    }

    return false;
  }

  onCloseApp(event) { // eslint-disable-line class-methods-use-this
    let message = true;

    if (this.props.hasChanges) {
      message = 'You have not saved changes in your project. Are you sure want to close app?';
      if (event) { event.returnValue = message; } // eslint-disable-line
    }

    return message;
  }

  getMenuBarItems() {
    return [
      {
        key: 'File',
        label: 'File',
        submenu: [
          {
            key: 'New_Project',
            label: 'New Project',
            click: this.showPopupCreateProject,
          },
          {
            key: 'file_sep1',
            type: 'separator',
          },
          {
            key: 'Import_Project',
            children: (
              <label
                key="import"
                className="load-button"
                htmlFor="importButton"
              >
                <input
                  type="file"
                  accept=".xodball"
                  onChange={this.onImportChange}
                  id="importButton"
                />
                <span>
                  Import project
                </span>
              </label>
            ),
          },
          {
            key: 'Export_Project',
            label: 'Export Project',
            click: this.onExport,
          },
          {
            key: 'file_sep2',
            type: 'separator',
          },
          {
            key: 'New_Patch',
            label: 'New Patch',
            click: this.props.actions.createPatch,
            hotkey: client.HOTKEY[client.COMMAND.ADD_PATCH],
          },
        ],
      },
      {
        key: 'Edit',
        label: 'Edit',
        submenu: [
          {
            key: 'Undo',
            label: 'Undo',
            click: this.props.actions.undoCurrentPatch,
            hotkey: client.HOTKEY[client.COMMAND.UNDO],
          },
          {
            key: 'Redo',
            label: 'Redo',
            click: this.props.actions.redoCurrentPatch,
            hotkey: client.HOTKEY[client.COMMAND.REDO],
          },
        ],
      },
      {
        key: 'Deploy',
        label: 'Deploy',
        submenu: [
          {
            key: 'Show Code for Espruino',
            label: 'Show Code for Espruino',
            click: this.onShowCodeEspruino,
          },
          {
            key: 'Upload to Espruino',
            label: 'Upload to Espruino',
            click: this.onUpload,
          },
          {
            key: 'deploy_sep',
            type: 'separator',
          },
          {
            key: 'Show Code for NodeJS',
            label: 'Show Code for NodeJS',
            click: this.onShowCodeNodejs,
          },
        ],
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
          selectedNodeType={this.props.selectedNodeType}
          onSelectNodeType={this.onSelectNodeType}
          onAddNodeClick={this.onAddNodeClick}
          menuBarItems={this.getMenuBarItems()}
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

const mapStateToProps = state => ({
  hasChanges: client.projectHasChanges(state),
  project: core.getProjectPojo(state),
  projectJSON: core.getProjectJSON(state),
  meta: core.getMeta(state),
  nodeTypes: core.dereferencedNodeTypes(state),
  selectedNodeType: client.getSelectedNodeType(state),
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    createProject: client.createProject,
    loadProjectFromJSON: client.loadProjectFromJSON,
    setMode: client.setMode,
    addError: client.addError,
    setSelectedNodeType: client.setSelectedNodeType,
    deleteProcess: client.deleteProcess,
    createPatch: client.requestCreatePatch,
    undoCurrentPatch: client.undoCurrentPatch,
    redoCurrentPatch: client.redoCurrentPatch,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
