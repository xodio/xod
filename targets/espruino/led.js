
var Node = require('@xod/impl/node');

var Led = function(meta) {
  Node.call(this, meta);
  this._pin = P9;
};

Led.prototype = Object.create(Node.prototype);
Led.prototype.constructor = Led;

Led.prototype.eval = function() {
  var b = this.inputs.brightness.pop();
  var e = this.inputs.enable.pop();
  var val = b * b * b * (+e);
  analogWrite(this._pin, val);
};

exports = Led;
