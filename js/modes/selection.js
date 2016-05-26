
import { listenNodes } from '../render/node';
import { listenLinks } from '../render/link';
import { renderPatch } from '../render/patch';

export default class SelectionMode {
  constructor(patch) {
    this._patch = patch;
  }

  enter() {
    d3.select('body').on('keydown.selection', this._onKeyDown.bind(this));
    this._patch.element().on('mousedown.selection', this._onClickBody.bind(this));
    listenNodes(this._patch, 'mousedown.selection', this._onClickEntity.bind(this));
    listenLinks(this._patch, 'mousedown.selection', this._onClickEntity.bind(this));
  }

  exit() {
    d3.select('body').on('keydown.selection', null);
    this._patch.element().on('mousedown.selection', null);
    listenNodes(this._patch, 'mousedown.selection', null);
    listenLinks(this._patch, 'mousedown.selection', null);
  }

  _onClickEntity(entity) {
    d3.event.stopPropagation();
    if (d3.event.shiftKey) {
      entity.feature('selected', !entity.isFeatured('selected'));
    } else {
      this._patch.emptyFeature('selected');
      entity.feature('selected');
    }

    renderPatch(this._patch);
  }

  _onClickBody() {
    if (d3.event.shiftKey) {
      return;
    }

    this._patch.emptyFeature('selected');
    renderPatch(this._patch);
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
    renderPatch(this._patch);
  }
}
