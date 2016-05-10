import React from 'react';
import Toolbar from './Toolbar';
import Sidebar from './Sidebar';
import Canvas from './Canvas';

export default class App extends React.Component {
  render() {
    const style = {
      fontFamily: 'Roboto',
      color: '#ddd',
    };

    const toolbarH = 48;
    const sidebarW = 240;

    return (
      <div style={style}>
        <Toolbar height={toolbarH} />
        <Sidebar top={toolbarH} width={sidebarW} />
        <Canvas left={sidebarW} top={toolbarH} />
      </div>
    );
  }
}
