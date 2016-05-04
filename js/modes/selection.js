
import { listenNodes, renderNodes } from '../render/node';
import { listenLinks, renderLinks } from '../render/link';

export default class SelectionMode {
  constructor(patch) {
    this._patch = patch;
  }

  enter() {
    d3.select('body').on('keydown.selection', this._onKeyDown.bind(this));
    listenNodes(this._patch, 'mousedown.selection', this._onClick.bind(this));
    listenLinks(this._patch, 'mousedown.selection', this._onClick.bind(this));
  }

  exit() {
    d3.select('body').on('keydown.selection', null);
    listenNodes(this._patch, 'mousedown.selection', null);
    listenLinks(this._patch, 'mousedown.selection', null);
  }

  _onClick(entity) {
    d3.event.preventDefault();
    if (d3.event.shiftKey) {
      entity.feature('selected', !entity.isFeatured('selected'));
    } else {
      this._patch.emptyFeature('selected');
      entity.feature('selected');
    }

    renderNodes(this._patch);
    renderLinks(this._patch);
  }

  _onKeyDown() {
    switch (d3.event.keyCode) {
      case 46: this._onDel(); break;
    }
  }

  _onDel() {
    d3.event.preventDefault();
    var selected = this._patch.featured('selected');
    this._patch.remove(selected);

    renderNodes(this._patch);
    renderLinks(this._patch);
  }
}
