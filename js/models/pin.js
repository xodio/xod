
import Model from './model';

export default class Pin extends Model { 
  constructor(isInput, obj, index, node) {
    super();
    this._isInput = isInput;
    this._obj = obj;
    this._index = index;
    this._node = node;
  }

  isInput() {
    return this._isInput;
  }

  isOutput() {
    return !this._isInput;
  }

  name() {
    return this._obj.name;
  }

  index() {
    return this._index;
  }

  node() {
    return this._node;
  }

  linkTo(pin) {
    var fromPin, toPin;
    if (this.isOutput() && pin.isInput()) {
      fromPin = this;
      toPin = pin;
    } else if (this.isInput() && pin.isOutput()) {
      fromPin = pin;
      toPin = this;
    } else {
      throw new Error('One pin should be output, another should be input');
    }

    this.node().patch().addLink({
      fromNode: fromPin.node(),
      fromOutput: fromPin,
      toNode: toPin.node(),
      toInput: toPin
    });
  }
}
