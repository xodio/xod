
import RubberLine from '../render/rubber-line';
import { listenPins, pinPosition } from '../render/pin';
import { renderNodes } from '../render/node';
import { renderLinks } from '../render/link';

export default class LinkingMode {
  constructor(patch) {
    this._patch = patch;
  }

  enter(pin, completeCallback) {
    this._linkingPin = pin;
    this._completeCallback = completeCallback;
    this._rubberLine = new RubberLine(this._patch.element(), pinPosition(pin));
    this._patch.feature(pin.validLinkPins(), 'valid-link');
    renderNodes(this._patch);

    d3.select('body').on('keydown.linking', this._onKeyDown.bind(this));
    this._patch.element().on('mousemove.linking', () => {
      let [x, y] = d3.mouse(this._patch.element().node());
      let linkingPos = pinPosition(this._linkingPin);
      // shift endpoint a bit so that rubber line don't capture
      // all click events
      x += (linkingPos.x > x) ? 2 : -2;
      y += (linkingPos.y > y) ? 2 : -2;
      this._rubberLine.targetPoint({x: x, y: y});
    });

    listenPins(this._patch, 'click.linking', this._onPinClick.bind(this));
  }

  exit() {
    this._rubberLine.remove();
    this._rubberLine = null;
    this._linkingPin = null;

    d3.select('body').on('keydown.linking', null);
    this._patch.element().on('mousemove.linking', null);
    listenPins(this._patch, 'click.linking', null);
    this._patch.emptyFeature('valid-link');

    renderNodes(this._patch);
  }

  _onPinClick(pin) {
    d3.event.preventDefault();

    this._linkingPin.linkTo(pin);
    renderLinks(this._patch);

    this._completeCallback();
    this._completeCallback = null;
    this.exit();
  }

  _onKeyDown() {
    switch (d3.event.keyCode) {
      case 8:  // Backspace
      case 27: // ESC
      case 46: // DEL
        this._onCancel();
        break;
    }
  }

  _onCancel() {
    d3.event.preventDefault();

    this._completeCallback();
    this._completeCallback = null;
    this.exit();
  }
}
