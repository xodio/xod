import React from 'react';
import Toolbar from './Toolbar';
import Sidebar from './Sidebar';
import PatchEditor from './PatchEditor';

import { loadPatch } from '../dao/patch';
import { sendPatchToEspruino } from '../upload';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      patch: null,
    }
  }

  componentDidMount() {
    loadPatch(this.props.patchUrl, (err, patch) => {
      this.setState({patch: patch});
    });
  }

  handleUpload() {
    sendPatchToEspruino(this.state.patch);
  }

  handleSelectionChanged(e) {
    console.log(e);
  }

  render() {
    const style = {
      fontFamily: 'Roboto',
      color: '#ddd',
    };

    const toolbarH = 48;
    const sidebarW = 240;

    return (
      <div style={style}>

        <Toolbar height={toolbarH}
          onUpload={() => this.handleUpload()}/>

        <Sidebar top={toolbarH} width={sidebarW} />

        <PatchEditor patch={this.state.patch} left={sidebarW} top={toolbarH}
          onSelectionChanged={this.handleSelectionChanged}/>

      </div>
    );
  }
}
