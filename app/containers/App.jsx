import React from 'react';
import R from 'ramda';
import Patch from '../containers/Patch';

export default class App extends React.Component {

  constructor(props) {
    super(props);

    this.project = this.props.project;
    this.curPatch = this.project.patches[this.props.editor.currentPatch];
    this.patchData = this.getPatchData();

    this.canvasSize = {
      width: (document) ? document.documentElement.clientWidth : 800,
      height: (document) ? document.documentElement.clientHeight : 600,
    };
  }

  getPatchNodes(nodes, patchId) {
    return R.pipe(
      R.values,
      R.reduce((p, node) => {
        const n = p;
        if (node.patchId === patchId) {
          n[node.id] = node;
        }
        return n;
      }, {})
    )(nodes);
  }
  getPatchPins(pins, nodes) {
    return R.pipe(
      R.values,
      R.reduce((p, pin) => {
        const n = p;
        if (nodes.hasOwnProperty(pin.nodeId)) {
          n[pin.id] = pin;
        }
        return n;
      }, {})
    )(pins);
  }
  getPatchLinks(links, pins) {
    return R.pipe(
      R.values,
      R.reduce((p, link) => {
        const n = p;
        if (pins.hasOwnProperty(link.fromPinId) && pins.hasOwnProperty(link.toPinId)) {
          n[link.id] = link;
        }
        return n;
      }, {})
    )(links);
  }
  getPatchData() {
    const data = {};

    data.patch = this.curPatch;
    data.nodes = this.getPatchNodes(this.project.nodes, data.patch.id);
    data.pins = this.getPatchPins(this.project.pins, data.nodes);
    data.links = this.getPatchLinks(this.project.links, data.pins);
    data.editorMode = this.props.editor.mode || 'edit';

    return data;
  }

  render() {
    return (
      <div>
        <Patch {...this.patchData} size={this.canvasSize} />
      </div>
    );
  }
}

App.propTypes = {
  project: React.PropTypes.any.isRequired,
  editor: React.PropTypes.any.isRequired,
  nodeTypes: React.PropTypes.any.isRequired,
};
