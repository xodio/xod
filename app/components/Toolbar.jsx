
import React from 'react';
import CreateNodeWidget from './CreateNodeWidget';

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
        <CreateNodeWidget
          nodeTypes={this.props.nodeTypes}
          selectedNodeType={this.props.selectedNodeType}
          onNodeTypeChange={this.props.onSelectNodeType}
          onAddNodeClick={this.props.onAddNodeClick}
        />

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
  nodeTypes: React.PropTypes.object,
  selectedNodeType: React.PropTypes.number,
  projectJSON: React.PropTypes.string,
  onUpload: React.PropTypes.func,
  onLoad: React.PropTypes.func,
  onSave: React.PropTypes.func,
  onSelectNodeType: React.PropTypes.func,
  onAddNodeClick: React.PropTypes.func,
};

export default Toolbar;
