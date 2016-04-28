
var Node = require('@xod/impl/node');

var TFlipFlop = function(meta) {
  Node.call(this, meta);
  this._val = false;
};

TFlipFlop.prototype = Object.create(Node.prototype);
TFlipFlop.prototype.constructor = TFlipFlop;

TFlipFlop.prototype.eval = function() {
  this.inputs.toggle.pop();
  this._val = !this._val;
  this.outputs.state.set(this._val);
};

exports = TFlipFlop;
