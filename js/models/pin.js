
import Model from './model';

export default class Pin extends Model { 
  constructor(isInput, obj, index, node) {
    super(node.patch());
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

  type() {
    return this._obj.type;
  }

  defaultValue() {
    return this._obj.defaultValue;
  }

  isValueType() {
    let t = this.type();
    return t !== 'event' && t !== 'trigger';
  }

  node() {
    return this._node;
  }

  links() {
    return this.patch().linksOf(this);
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

  canLink() {
    return this.isOutput() || this.type() === 'trigger' || !this.links().length;
  }

  validLinkPins() {
    let pins = this.patch().pins();
    pins = pins.filter(x => x.isInput() === this.isOutput());
    pins = pins.filter(x => x.isValueType() === this.isValueType());
    pins = pins.filter(x => x.node() !== this.node());
    pins = pins.filter(x => x.canLink());
    return pins;
  }
}
