
import Model from './model';
import Pin from './pin';

export default class Node extends Model { 
  constructor(opts) {
    super(opts.patch);
    this._obj = opts.obj;
    this._layoutObj = opts.layoutObj;
    this._typeObj = opts.typeObj;
    this._patch = opts.patch;

    this._inputs = new Map((this._typeObj.inputs || []).map(
      (inputObj, i) => [inputObj.name, new Pin(true, inputObj, i, this)]));

    this._outputs = new Map((this._typeObj.outputs || []).map(
      (outputObj, i) => [outputObj.name, new Pin(false, outputObj, i, this)]));
  }

  patch() {
    return this._patch;
  }

  type() {
    return this._obj.type;
  }

  id() {
    return this._obj.id;
  }

  pos(val) {
    if (val === undefined) {
      return {
        x: this._layoutObj.x,
        y: this._layoutObj.y
      }
    }

    this._layoutObj.x = val.x;
    this._layoutObj.y = val.y;
    return this;
  }

  inputs() {
    return Array.from(this._inputs.values());
  }

  input(name) {
    return this._inputs.get(name);
  }

  outputs() {
    return Array.from(this._outputs.values());
  }

  output(name) {
    return this._outputs.get(name);
  }

  pins() {
    return this.inputs().concat(this.outputs());
  }
}
