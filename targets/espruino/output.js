

var Output = function() {
  this._links = [];
};

Output.prototype.linkTo = function(input) {
  if (!input) throw new TypeError('input is undefined');
  this._links.push(input);
};

Output.prototype.set = function(value) {
  this._links.forEach(function(input) {
    input.set(value);
  });
};

// ========================================================
var ValueOutput = function(type) {
  Output.call(this);
  this._type = type;
  this._val = new type();
};

ValueOutput.prototype = Object.create(Output.prototype);
ValueOutput.prototype.constructor = ValueOutput;

ValueOutput.prototype.set = function(val) {
  this._val = new this._type(val);
  Output.prototype.set.call(this, this._val);
};

// ========================================================
var EventOutput = function() {
  Output.call(this);
  this._val = false;
};

EventOutput.prototype = Object.create(Output.prototype);
EventOutput.prototype.constructor = EventOutput;

EventOutput.prototype.set = function() {
  this._val = true;
  Output.prototype.set.call(this);
};

// ========================================================
exports.create = function(type) {
  switch (type) {
    case 'event': return new EventOutput();
    case 'bool': return new ValueOutput(Boolean);
    case 'number': return new ValueOutput(Number);
    case 'string': return new ValueOutput(String);
    default: throw new TypeError("Unknown output type: " + type);
  }
};
