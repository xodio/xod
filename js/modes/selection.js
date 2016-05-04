
import { listenNodes, renderNodes } from '../render/node';
import { listenLinks, renderLinks } from '../render/link';

export default class SelectionMode {
  constructor(patch) {
    this._patch = patch;
  }

  enter() {
    listenNodes(this._patch, 'mousedown.selection', this._onClick.bind(this));
    listenLinks(this._patch, 'mousedown.selection', this._onClick.bind(this));
  }

  exit() {
    listenNodes(this._patch, 'mousedown.selection', null);
    listenLinks(this._patch, 'mousedown.selection', null);
  }

  _onClick(entity) {
    d3.event.preventDefault();
    if (d3.event.shiftKey) {
      entity.feature('selected', !entity.featured('selected'));
    } else {
      this._patch.emptyFeature('selected');
      entity.feature('selected');
    }
    renderNodes(this._patch);
    renderLinks(this._patch);
  }
}
