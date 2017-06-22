import React from 'react';
import * as XP from 'xod-project';
import sanctuaryPropType from '../../utils/sanctuaryPropType';
import PopupForm from '../../utils/components/PopupForm';

class PopupProjectPreferences extends React.Component {
  constructor(props) {
    super(props);
    const version = XP.getProjectVersion(props.project);

    this.state = {
      license: XP.getProjectLicense(props.project),
      version,
      dirtyVersion: version,
      description: XP.getProjectDescription(props.project),
    };

    this.onUpdateClicked = this.onUpdateClicked.bind(this);
    this.onLicenseChange = this.onLicenseChange.bind(this);
    this.onVersionChange = this.onVersionChange.bind(this);
    this.onDescriptionChange = this.onDescriptionChange.bind(this);
    this.commitVersionChange = this.commitVersionChange.bind(this);
  }

  onUpdateClicked() {
    const { license, version, description } = this.state;
    this.props.onChange({ license, version, description });
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

  commitVersionChange() {
    if (XP.isValidVersion(this.state.dirtyVersion)) {
      this.setState({ version: this.state.dirtyVersion });
    } else {
      this.setState({ dirtyVersion: this.state.version });
    }
  }

  render() {
    return (
      <PopupForm
        isVisible={this.props.isVisible}
        title="Project preferences"
        onClose={this.props.onClose}
      >
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
          <label htmlFor="projectDescription">Description: </label>
          <textarea
            className="inspectorTextInput inspectorInput--full-width"
            id="projectDescription"
            onChange={this.onDescriptionChange}
            value={this.state.description}
          />
        </div>
        <div className="ModalFooter">
          <button onClick={this.onUpdateClicked} className="Button">
            Update project preferences
          </button>
        </div>
      </PopupForm>
    );
  }
}

PopupProjectPreferences.propTypes = {
  isVisible: React.PropTypes.bool,
  project: sanctuaryPropType(XP.Project),
  onChange: React.PropTypes.func,
  onClose: React.PropTypes.func,
};

PopupProjectPreferences.defaultProps = {
  isVisible: false,
};

export default PopupProjectPreferences;
