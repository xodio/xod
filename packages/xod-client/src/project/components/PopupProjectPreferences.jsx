import React from 'react';
import PropTypes from 'prop-types';
import * as XP from 'xod-project';
import sanctuaryPropType from '../../utils/sanctuaryPropType';
import PopupForm from '../../utils/components/PopupForm';
import deepSCU from '../../utils/deepSCU';

const getInitialState = (project) => {
  const version = XP.getProjectVersion(project);

  return {
    license: XP.getProjectLicense(project),
    version,
    dirtyVersion: version,
    description: XP.getProjectDescription(project),
  };
};

class PopupProjectPreferences extends React.Component {
  constructor(props) {
    super(props);
    this.state = getInitialState(props.project);

    this.shouldComponentUpdate = deepSCU.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState(getInitialState(nextProps.project));
  }

  onUpdateClicked = () => {
    const { license, version, description } = this.state;
    this.props.onChange({ license, version, description });
  };

  onLicenseChange = (event) => {
    this.setState({ license: event.target.value });
  };

  onVersionChange = (event) => {
    this.setState({ dirtyVersion: event.target.value });
  };

  onDescriptionChange = (event) => {
    this.setState({ description: event.target.value });
  };

  commitVersionChange = () => {
    if (XP.isValidVersion(this.state.dirtyVersion)) {
      this.setState({ version: this.state.dirtyVersion });
    } else {
      this.setState({ dirtyVersion: this.state.version });
    }
  };

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
  isVisible: PropTypes.bool,
  project: sanctuaryPropType(XP.Project), // eslint-disable-line react/no-unused-prop-types
  onChange: PropTypes.func,
  onClose: PropTypes.func,
};

PopupProjectPreferences.defaultProps = {
  isVisible: false,
};

export default PopupProjectPreferences;
