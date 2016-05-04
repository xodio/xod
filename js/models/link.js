
import Model from './model';

export default class Link extends Model { 
  constructor(obj, patch) {
    super(patch);
    this._obj = obj;
    this._patch = patch;
  }

  from() {
    return this._patch.node(this._obj.fromNode).output(this._obj.fromOutput);
  }

  to() {
    return this._patch.node(this._obj.toNode).input(this._obj.toInput);
  }
}
