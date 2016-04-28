
var Node = require('@xod/node');
var inputs = require('@xod/input');
var outputs = require('@xod/output');

var TFlipFlop = function() {
  Node.call(this);

  this._val = false;

  this.inputs.toggle = new inputs.TriggerInput(this);
  this.outputs.value = new outputs.ValueOutput(Boolean);
};

TFlipFlop.prototype = Object.create(Node.prototype);
TFlipFlop.prototype.constructor = TFlipFlop;

TFlipFlop.prototype.eval = function() {
  this.inputs.toggle.pop();
  this._val = !this._val;
  this.outputs.value.set(this._val);
};

exports.Node = TFlipFlop;
