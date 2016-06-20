import React from 'react';
import Canvas from '../containers/canvas.jsx';

export default class App extends React.Component {

  constructor(props) {
    super(props);

    this.project = this.props.project;
    this.curPatch = this.project.patches[this.props.editor.currentPatch];

    this.canvasSize = {
      width: (document) ? document.documentElement.clientWidth : 800,
      height: (document) ? document.documentElement.clientHeight : 600
    };

    console.log('curPatch >', this.curPatch);
  }

  render() {
    return (
    	<div>
		    <Canvas {...this.curPatch} size={this.canvasSize} />
      </div>
    );
  }
}
