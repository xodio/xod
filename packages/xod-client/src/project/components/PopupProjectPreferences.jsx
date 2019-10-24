import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Icon from 'react-fa';
import * as XP from 'xod-project';
import sanctuaryPropType from '../../utils/sanctuaryPropType';
import PopupForm from '../../utils/components/PopupForm';
import deepSCU from '../../utils/deepSCU';
import { lowercaseKebabMask } from '../../utils/inputFormatting';

const getInitialState = project => {
  const version = XP.getProjectVersion(project);

  return {
    name: XP.getProjectName(project),
    license: XP.getProjectLicense(project),
    version,
    dirtyVersion: version,
    description: XP.getProjectDescription(project),
    apiKey: XP.getApiKey(project),
    isGenerating: false,
  };
};

class PopupProjectPreferences extends React.Component {
  constructor(props) {
    super(props);
    this.state = getInitialState(props.project);

    this.onUpdateClicked = this.onUpdateClicked.bind(this);
    this.onNameChange = this.onNameChange.bind(this);
    this.onLicenseChange = this.onLicenseChange.bind(this);
    this.onVersionChange = this.onVersionChange.bind(this);
    this.onDescriptionChange = this.onDescriptionChange.bind(this);
    this.onApiKeyChange = this.onApiKeyChange.bind(this);
    this.commitVersionChange = this.commitVersionChange.bind(this);
    this.generateApiKey = this.generateApiKey.bind(this);
    this.shouldComponentUpdate = deepSCU.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ apiKey: XP.getApiKey(nextProps.project) });
  }

  onUpdateClicked() {
    const { name, license, version, description, apiKey } = this.state;
    this.props.onChange({ name, license, version, description, apiKey });
  }
  onNameChange(event) {
    const val = lowercaseKebabMask(event.target.value);
    this.setState({ name: val });
  }
  onLicenseChange(event) {
    this.setState({ license: event.target.value });
  }
  onVersionChange(event) {
    this.setState({ dirtyVersion: event.target.value });
  }
  onDescriptionChange(event) {
    this.setState({ description: event.target.value });
  }
  onApiKeyChange(event) {
    this.setState({ apiKey: event.target.value });
  }

  commitVersionChange() {
    if (XP.isValidVersion(this.state.dirtyVersion)) {
      this.setState({ version: this.state.dirtyVersion });
    } else {
      this.setState({ dirtyVersion: this.state.version });
    }
  }

  generateApiKey() {
    this.setState({
      isGenerating: true,
    });

    this.props.onGenerateApiKey(this.state.name).then(() =>
      this.setState({
        isGenerating: false,
      })
    );
  }

  isValidName() {
    return XP.isValidIdentifier(this.state.name);
  }

  render() {
    const nameInputClasses = classNames(
      'inspectorTextInput',
      'inspectorInput--full-width',
      {
        invalid: !this.isValidName() && this.state.name !== '',
      }
    );
    const isFormValid = this.isValidName();

    return (
      <PopupForm
        isVisible={this.props.isVisible}
        title="Project preferences"
        onClose={this.props.onClose}
      >
        <div className="ModalContent">
          <label htmlFor="projectName">Name: </label>
          <input
            className={nameInputClasses}
            type="text"
            id="projectName"
            onChange={this.onNameChange}
            value={this.state.name}
          />
          <p className="helpText">{XP.IDENTIFIER_RULES}</p>
        </div>
        <div className="ModalContent">
          <label htmlFor="projectLicense">License: </label>
          <input
            className="inspectorTextInput inspectorInput--full-width"
            type="text"
            id="projectLicense"
            onChange={this.onLicenseChange}
            value={this.state.license}
          />
        </div>
        <div className="ModalContent">
          <label htmlFor="projectVersion">Version: </label>
          <input
            className="inspectorTextInput inspectorInput--full-width"
            type="text"
            id="projectVersion"
            onBlur={this.commitVersionChange}
            onChange={this.onVersionChange}
            value={this.state.dirtyVersion}
          />
        </div>
        <div className="ModalContent">
          <label htmlFor="cloudApiKey">XOD Cloud API Key: </label>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
            }}
          >
            <input
              className="inspectorTextInput inspectorInput--full-width"
              type="text"
              id="cloudApiKey"
              value={this.state.apiKey}
              onChange={this.onApiKeyChange}
            />
            <button
              className="Button Button--small"
              style={{ marginLeft: '1em', width: '100px' }}
              onClick={this.generateApiKey}
              disabled={this.state.isGenerating}
            >
              {this.state.isGenerating ? (
                <Icon name="circle-o-notch" spin />
              ) : (
                'Generate'
              )}
            </button>
          </div>
        </div>
        <div className="ModalContent">
          <label htmlFor="projectDescription">Description: </label>
          <textarea
            className="inspectorTextInput inspectorInput--full-width"
            id="projectDescription"
            onChange={this.onDescriptionChange}
            value={this.state.description}
          />
        </div>
        <div className="ModalFooter">
          <button
            onClick={this.onUpdateClicked}
            disabled={!isFormValid}
            className="Button"
          >
            Update project preferences
          </button>
        </div>
      </PopupForm>
    );
  }
}

PopupProjectPreferences.propTypes = {
  isVisible: PropTypes.bool,
  project: sanctuaryPropType(XP.Project), // eslint-disable-line react/no-unused-prop-types
  onGenerateApiKey: PropTypes.func,
  onChange: PropTypes.func,
  onClose: PropTypes.func,
};

PopupProjectPreferences.defaultProps = {
  isVisible: false,
};

export default PopupProjectPreferences;
