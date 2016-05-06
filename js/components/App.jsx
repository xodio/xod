import React from 'react';
import Toolbar from './Toolbar';
import Canvas from './Canvas';

export default class App extends React.Component {
  render() {
    return <div>
      <Toolbar />
      <Canvas />
    </div>;
  }
}
