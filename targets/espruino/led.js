
var Node = require('@xod/node');
var inputs = require('@xod/input');

var Led = function(wiring) {
  Node.call(this);
  this._pin = P9;

  this.inputs.enable = new inputs.ValueInput(this, Boolean);
  this.inputs.brightness = new inputs.ValueInput(this, Number);
};

Led.prototype = Object.create(Node.prototype);
Led.prototype.constructor = Led;

Led.prototype.eval = function() {
  var b = this.inputs.brightness.pop();
  var e = this.inputs.enable.pop();
  b = 1; // FIXME: hard-code
  var val = b * b * b * (+e);
  analogWrite(this._pin, val);
};

exports.Node = Led;
