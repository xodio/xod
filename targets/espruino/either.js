
var Node = require('@xod/impl/node');

var Either = function(meta, props) {
  Node.call(this, meta, props);
};

Either.prototype = Object.create(Node.prototype);
Either.prototype.constructor = Either;

Either.prototype.eval = function() {
  var x = this.inputs['in'].pop();
  var ifTrue = this.inputs.ifTrue.pop();
  var ifFalse = this.inputs.ifFalse.pop();
  this.outputs.out.set(x ? ifTrue : ifFalse);
};

exports = Either;
