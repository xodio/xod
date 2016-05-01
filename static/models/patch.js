
var Patch = {};

Patch.wrap = function(obj) {
  obj.uiOf = function(node) {
    if (typeof node === 'object') {
      node = node.id;
    }

    return this.ui.nodes[node];
  }

  obj.nodeByID = function(nodeID) {
    for (var i = 0; i < this.nodes.length; ++i) {
      let node = this.nodes[i];
      if (node.id === nodeID) {
        return node;
      }
    }
  }

  obj.typeOf = function(node) {
    if (typeof node === 'number') {
      node = this.nodeByID(node);
    }

    return nodeRepository.get(node.type);
  }

  obj.outputIndex = function(node, outputName) {
    let type = this.typeOf(node);
    if (!type.outputs) {
      return;
    }

    for (var i = 0; i < type.outputs.length; ++i) {
      if (type.outputs[i].name === outputName) {
        return i;
      }
    }
  }

  obj.inputIndex = function(node, inputName) {
    let type = this.typeOf(node);
    if (!type.inputs) {
      return;
    }

    for (var i = 0; i < type.inputs.length; ++i) {
      if (type.inputs[i].name === inputName) {
        return i;
      }
    }
  }

  return obj;
}
