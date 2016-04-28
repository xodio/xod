
var Node = function() {
  this.inputs = {};
  this.outputs = {};
};

Node.prototype.link = function(outputName, toNode, inputName) {
  this.outputs[outputName].linkTo(toNode.inputs[inputName]);
};

exports = Node;
