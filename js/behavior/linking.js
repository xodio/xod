
import RubberLine from '../render/rubber-line';
import { listenPins, pinPosition } from '../render/pin';

export default class LinkingBehavior {
  constructor(canvas, completeCallback) {
    this._canvas = canvas;
    this._linkingPin = null;
    this._rubberLine = null;
    this._completeCallback = completeCallback;
  }

  listen() {
    listenPins('click.linking', this._handlePinClick.bind(this));
  }

  _handlePinClick(pin) {
    d3.event.preventDefault();
    if (!this._linkingPin) {
      this._beginLink(pin);
    } else {
      this._completeLink(pin);
    }
  }

  _beginLink(pin) {
    this._linkingPin = pin;
    this._rubberLine = new RubberLine(this._canvas, pinPosition(pin));
    this._canvas.on('mousemove.linking', () => {
      let [x, y] = d3.mouse(this._canvas.node());
      this._rubberLine.targetPoint({x: x - 1, y: y + 1});
    });
  }

  _completeLink(pin) {
    this._linkingPin.linkTo(pin);
    this._linkingPin = null;
    this._rubberLine.remove();
    this._rubberLine = null;
    this._canvas.on('mousemove.linking', null);
    this._completeCallback();
  }
}
