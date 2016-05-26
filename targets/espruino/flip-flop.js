
var Node = require('@xod/impl/node');

var FlipFlop = function(meta, props) {
  Node.call(this, meta, props);
  this._val = false;
};

FlipFlop.prototype = Object.create(Node.prototype);
FlipFlop.prototype.constructor = FlipFlop;

FlipFlop.prototype.eval = function() {
  if (this.inputs.toggle.pop()) {
    this._val = !this._val;
  } else if (this.inputs.set.pop()) {
    this._val = true;
  } else if (this.inputs.reset.pop()) {
    this._val = false;
  }

  this.outputs.state.set(this._val);
};

exports = FlipFlop;
