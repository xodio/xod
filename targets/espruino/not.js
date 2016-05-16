
var Node = require('@xod/impl/node');

var Not = function(meta, props) {
  Node.call(this, meta, props);
};

Not.prototype = Object.create(Node.prototype);
Not.prototype.constructor = Not;

Not.prototype.eval = function() {
  var x = this.inputs['in'].pop();
  this.outputs.out.set(!x);
};

exports = Not;
