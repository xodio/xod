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
      selection: [],
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
    this.setState({selection: e.selection});
  }

  render() {
    const style = {
      fontFamily: 'Roboto',
      color: '#ddd',
    };

    const toolbarH = 48;
    const sidebarW = 240;

    // FIXME: incorrect `this` binding leads to () => this.handleXXX
    return (
      <div style={style}>

        <Toolbar height={toolbarH}
          onUpload={() => this.handleUpload()}/>

        <Sidebar top={toolbarH} width={sidebarW} selection={this.state.selection} />

        <PatchEditor patch={this.state.patch} left={sidebarW} top={toolbarH}
          onSelectionChanged={(e) => this.handleSelectionChanged(e)}/>

      </div>
    );
  }
}
