
var Input = function(ownerNode) {
  this._ownerNode = ownerNode;
};

Input.prototype.set = function() {
  this._ownerNode.eval();
};

// ========================================================
var ValueInput = function(ownerNode, type) {
  Input.call(this, ownerNode);
  this._type = type;
  this._val = new type();
};

ValueInput.prototype = Object.create(Input.prototype);
ValueInput.prototype.constructor = ValueInput;

ValueInput.prototype.set = function(val) {
  this._val = new this._type(val);
  Input.prototype.set.call(this);
};

ValueInput.prototype.pop = function() {
  return this._val;
};

// ========================================================
var TriggerInput = function(ownerNode) {
  Input.call(this, ownerNode);
  this._val = false;
};

TriggerInput.prototype = Object.create(Input.prototype);
TriggerInput.prototype.constructor = TriggerInput;

TriggerInput.prototype.set = function() {
  this._val = true;
  Input.prototype.set.call(this);
};

TriggerInput.prototype.pop = function() {
  var val = this._val;
  this._val = false;
  return val;
};

// ========================================================
exports.create = function(meta, ownerNode) {
  switch (meta.type) {
    case 'trigger': return new TriggerInput(ownerNode);
    case 'bool': return new ValueInput(ownerNode, Boolean);
    case 'number': return new ValueInput(ownerNode, Number);
    case 'string': return new ValueInput(ownerNode, String);
    default: throw new TypeError("Unknown input type: " + meta.type);
  }
};
