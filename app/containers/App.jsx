import React from 'react'
import Patch from '../containers/Patch.jsx'

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
		    <Patch {...this.curPatch} size={this.canvasSize} />
      </div>
    );
  }
}
