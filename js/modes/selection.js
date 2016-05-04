
import { listenNodes, renderNodes } from '../render/node';

export default class SelectionMode {
  constructor(patch) {
    this._patch = patch;
  }

  enter() {
    listenNodes(this._patch, 'mousedown.selection', this._onNodeClick.bind(this));
  }

  exit() {
    listenNodes(this._patch, 'mousedown.selection', null);
  }

  _onNodeClick(node) {
    d3.event.preventDefault();
    if (d3.event.shiftKey) {
      node.feature('selected', !node.featured('selected'));
    } else {
      this._patch.emptyFeature('selected');
      node.feature('selected');
    }
    renderNodes(this._patch);
  }
}
