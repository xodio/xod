
var createInput = require('@xod/impl/input').create;
var createOutput = require('@xod/impl/output').create;

var Node = function(meta, props) {
  var self = this;

  this.inputs = {};
  this.outputs = {};

  meta.inputs.forEach(function(x) {
    var val = props[x.name];
    if (val === undefined) {
      val = x.defaultValue;
    }

    self.inputs[x.name] = createInput(self, x.type, val);
  });

  meta.outputs.forEach(function(x) {
    self.outputs[x.name] = createOutput(x.type);
  });
};

Node.prototype.link = function(outputName, toNode, inputName) {
  this.outputs[outputName].linkTo(toNode.inputs[inputName]);
};

Node.prototype.eval = function() {
};

exports = Node;
