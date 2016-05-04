
import RubberLine from '../render/rubber-line';
import { listenPins, pinPosition } from '../render/pin';
import { renderLinks } from '../render/link';

export default class LinkingMode {
  constructor(patch) {
    this._patch = patch;
  }

  enter(pin, completeCallback) {
    this._linkingPin = pin;
    this._completeCallback = completeCallback;
    this._rubberLine = new RubberLine(this._patch.element(), pinPosition(pin));
    this._patch.element().on('mousemove.linking', () => {
      let [x, y] = d3.mouse(this._patch.element().node());
      this._rubberLine.targetPoint({x: x - 1, y: y + 1});
    });

    listenPins(this._patch, 'click.linking', this._onPinClick.bind(this));
  }

  exit() {
    this._patch.element().on('mousemove.linking', null);
  }

  _onPinClick(pin) {
    d3.event.preventDefault();

    this._linkingPin.linkTo(pin);
    this._linkingPin = null;

    this._rubberLine.remove();
    this._rubberLine = null;

    renderLinks(this._patch);

    this._completeCallback();
    this._completeCallback = null;
  }
}
