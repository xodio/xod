import React from 'react';

import { renderPatch } from '../render/patch';
import { listenPins } from '../render/pin';
import SelectionMode from '../modes/selection';
import LinkingMode from '../modes/linking';

export default class Canvas extends React.Component {
  componentDidMount() {
    let svg = d3.select(this._svg);
    let patch = this.props.patch;

    patch.element(svg);
    patch.on('feature', this.handleFeatureChange.bind(this));
    renderPatch(patch);

    this._selectionMode = new SelectionMode(patch);
    this._linkingMode = new LinkingMode(patch);

    this._selectionMode.enter();
    this.listenEnterLinking();
  }

  handleFeatureChange(e) {
    if (e.feature === 'selected') {
      this.props.onSelectionChanged({
        selection: this.props.patch.featured('selected'),
      });
    }
  }

  listenEnterLinking() {
    let patch = this.props.patch;
    listenPins(patch, 'click.enter-linking', (pin) => {
      if (!pin.canLink()) {
        return;
      }

      listenPins(patch, 'click.enter-linking', null);
      this._selectionMode.exit();
      this._linkingMode.enter(pin, () => {
        this._selectionMode.enter();
        this.listenEnterLinking();
      });
    });
  }

  render() {
    return (
      <svg id="canvas" width={1920} height={1080} ref={(svg) => this._svg = svg}>
      </svg>
    );
  }
}
