
var createInput = require('@xod/impl/input').create;
var createOutput = require('@xod/impl/output').create;

var Node = function(meta) {
  var self = this;

  this.inputs = {};
  this.outputs = {};

  meta.inputs.forEach(function(x) {
    self.inputs[x.name] = createInput(x, self);
  });

  meta.outputs.forEach(function(x) {
    self.outputs[x.name] = createOutput(x);
  });
};

Node.prototype.link = function(outputName, toNode, inputName) {
  this.outputs[outputName].linkTo(toNode.inputs[inputName]);
};

exports = Node;
