
var Patch = function(obj, nodeRepository) {
  this._obj = obj;

  this._nodes = new Map(obj.nodes.map(
    nodeObj => [
      nodeObj.id,
      new Node({
        obj: nodeObj,
        layoutObj: obj.ui.nodes[nodeObj.id],
        typeObj: nodeRepository.get(nodeObj.type),
        patch: this
      })
    ]
  ));

  this._links = obj.links.map(
    linkObj => new Link(linkObj, this));
};

Patch.nodeTypes = /* static */ function(obj) {
  return obj.nodes.map(x => x.type);
};

Patch.prototype.nodes = function() {
  return Array.from(this._nodes.values());
};

Patch.prototype.node = function(id) {
  return this._nodes.get(id);
};

Patch.prototype.links = function() {
  return this._links;
};

Patch.prototype.addLink = function(opts) {
  var linkObj = {
    fromNode: opts.fromNode.id(),
    fromOutput: opts.fromOutput.name(),
    toNode: opts.toNode.id(),
    toInput: opts.toInput.name(),
  };

  this._obj.links.push(linkObj);
  this._links.push(new Link(linkObj, this));
};

// ==========================================================================
var Node = function(opts) {
  this._obj = opts.obj;
  this._layoutObj = opts.layoutObj;
  this._typeObj = opts.typeObj;
  this._patch = opts.patch;

  this._inputs = new Map((this._typeObj.inputs || []).map(
    (inputObj, i) => [inputObj.name, new Pin(true, inputObj, i, this)]));

  this._outputs = new Map((this._typeObj.outputs || []).map(
    (outputObj, i) => [outputObj.name, new Pin(false, outputObj, i, this)]));
};

Node.prototype.patch = function() {
  return this._patch;
};

Node.prototype.type = function() {
  return this._obj.type;
};

Node.prototype.id = function() {
  return this._obj.id;
};

Node.prototype.x = function() {
  return this._layoutObj.x;
};

Node.prototype.y = function() {
  return this._layoutObj.y;
};

Node.prototype.pos = function(val) {
  if (val === undefined) {
    return {
      x: this._layoutObj.x,
      y: this._layoutObj.y
    }
  }

  this._layoutObj.x = val.x;
  this._layoutObj.y = val.y;
  return this;
};

Node.prototype.inputs = function() {
  return Array.from(this._inputs.values());
};

Node.prototype.input = function(name) {
  return this._inputs.get(name);
};

Node.prototype.outputs = function() {
  return Array.from(this._outputs.values());
};

Node.prototype.output = function(name) {
  return this._outputs.get(name);
};

// ==========================================================================
var Link = function(obj, patch) {
  this._obj = obj;
  this._patch = patch;
};

Link.prototype.from = function() {
  return this._patch.node(this._obj.fromNode).output(this._obj.fromOutput);
};

Link.prototype.to = function() {
  return this._patch.node(this._obj.toNode).input(this._obj.toInput);
};

// ==========================================================================
var Pin = function(isInput, obj, index, node) {
  this._isInput = isInput;
  this._obj = obj;
  this._index = index;
  this._node = node;
};

Pin.prototype.isInput = function() {
  return this._isInput;
};

Pin.prototype.isOutput = function() {
  return !this._isInput;
};

Pin.prototype.name = function() {
  return this._obj.name;
};

Pin.prototype.index = function() {
  return this._index;
};

Pin.prototype.node = function() {
  return this._node;
};

Pin.prototype.linkTo = function(pin) {
  var fromPin, toPin;
  if (this.isOutput() && pin.isInput()) {
    fromPin = this;
    toPin = pin;
  } else if (this.isInput() && pin.isOutput()) {
    fromPin = pin;
    toPin = this;
  } else {
    throw new Error('One pin should be output, another should be input');
  }

  this.node().patch().addLink({
    fromNode: fromPin.node(),
    fromOutput: fromPin,
    toNode: toPin.node(),
    toInput: toPin
  });
};

export {Patch, Node, Link, Pin};
