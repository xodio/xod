
var Node = require('@xod/impl/node');

var Pot = function(meta, props) {
  Node.call(this, meta, props);
  setInterval(this._onInterval.bind(this), 20);
};

Pot.prototype = Object.create(Node.prototype);
Pot.prototype.constructor = Pot;

Pot.prototype._onInterval = function() {
  this.outputs.value.set(analogRead(A0));
};

exports = Pot;
