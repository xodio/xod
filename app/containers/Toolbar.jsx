
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Selectors from '../selectors';
import * as Actions from '../actions';

class Toolbar extends React.Component {
  constructor(props) {
    super(props);
    this.onProjectNameClick = this.onProjectNameClick.bind(this);
    this.onSave = this.onSave.bind(this);
    this.onLoad = this.onLoad.bind(this);
  }

  onProjectNameClick() {
    return this.props.actions.updateMeta({
      name: 'Mega project',
    });
  }

  onLoad(event) {
    const input = event.target;
    const files = input.files;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!(/.*\/json/).test(file.type)) {
        continue;
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        this.props.actions.updateProject(evt.target.result);
      };

      reader.readAsText(file);
    }

    input.value = '';
  }

  onSave() {
    const url = `data:text/json;charset=utf8,${encodeURIComponent(this.props.projectJSON)}`;
    window.open(url, '_blank');
    window.focus();
  }

  render() {
    const meta = this.props.meta;

    return (
      <div className="Toolbar">
        <div className="logo">
          XOD
        </div>
        <div className="project-meta">
          <span onClick={this.onProjectNameClick}>
            {meta.name}
          </span>
          <span>
            {(meta.author) ? ` by ${meta.author}` : ''}
          </span>
        </div>
        <button
          className="upload-button"
          onClick={this.props.onUpload}
        >
          UPLOAD
        </button>
        <button
          className="save-button"
          onClick={this.onSave}
        >
          Save project as
        </button>
        <label
          className="load-button"
        >
          <input
            type="file"
            onChange={this.onLoad}
          />
          <span>
            Load project
          </span>
        </label>
      </div>
    );
  }
}

Toolbar.propTypes = {
  meta: React.PropTypes.object,
  actions: React.PropTypes.object,
  projectJSON: React.PropTypes.string,
  onUpload: React.PropTypes.func,
};

const mapStateToProps = (state) => ({
  projectJSON: Selectors.Project.getJSON(state),
  meta: Selectors.Meta.getMeta(state),
});
const mapDispatchToProps = (dispatch) => ({
  actions: bindActionCreators({
    updateMeta: Actions.updateMeta,
    updateProject: Actions.updateProjectData,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Toolbar);
