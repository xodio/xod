
import React from 'react';

class Toolbar extends React.Component {
  constructor(props) {
    super(props);
    this.onSave = this.onSave.bind(this);
    this.onLoad = this.onLoad.bind(this);
  }

  onLoad(event) {
    const input = event.target;
    const files = input.files;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!(/.+\.xod$/).test(file.name)) {
        this.props.actions.showError({
          message: SAVE_LOAD_ERRORS.LOAD_EXTENSION,
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        this.props.onLoad(evt.target.result);
      };

      reader.readAsText(file);
    }

    input.value = '';
  }

  onSave() {
    this.props.onSave();
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
            accept=".xod"
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
  projectJSON: React.PropTypes.string,
  onUpload: React.PropTypes.func,
  onLoad: React.PropTypes.func,
  onSave: React.PropTypes.func,
};

export default Toolbar;
