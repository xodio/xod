import React from 'react';
import { connect } from 'react-redux';

import Patch from './Patch';

class Editor extends React.Component {
  constructor(props) {
    super(props);
    this.displayName = 'Editor';

    this.onProjectNameClick = this.onProjectNameClick.bind(this);
  }

  onProjectNameClick() {
    return this.props.dispatch({
      type: 'META_UPDATE',
      data: {
        name: 'Mega project',
      },
    });
  }

  render() {
    const projectMeta = this.props.project.meta;

    return (
      <div>
        <h1 onClick={this.onProjectNameClick}>
          {projectMeta.name} {(projectMeta.author) ? `by ${projectMeta.author}` : ''}
        </h1>
        <Patch size={this.props.size} />
      </div>
    );
  }
}

Editor.propTypes = {
  dispatch: React.PropTypes.func.isRequired,
  project: React.PropTypes.any.isRequired,
  editor: React.PropTypes.any.isRequired,
  nodeTypes: React.PropTypes.any.isRequired,
  size: React.PropTypes.any.isRequired,
};

export default connect(state => state)(Editor);
