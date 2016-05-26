
import Model from './model';

export default class Link extends Model { 
  constructor(obj, patch) {
    super(patch);
    this._obj = obj;
    this._patch = patch;
  }

  id() {
    return this._obj.id;
  }

  from() {
    return this.fromNode().output(this._obj.fromOutput);
  }

  fromNode() {
    return this._patch.node(this._obj.fromNode);
  }

  to() {
    return this.toNode().input(this._obj.toInput);
  }

  toNode() {
    return this._patch.node(this._obj.toNode);
  }
}
