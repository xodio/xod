
var outputs = require('@xod/output');
var Node = require('@xod/node');

var Switch = function(wiring) {
  Node.call(this);
  setWatch(this._onTrigger.bind(this), P8, {repeat: true, debounce: 30});
  this.outputs.press = new outputs.EventOutput();
  this.outputs.release = new outputs.EventOutput();
  this.outputs.state = new outputs.ValueOutput(Boolean);
};

Switch.prototype = Object.create(Node.prototype);
Switch.prototype.constructor = Switch;

Switch.prototype._onTrigger = function(e) {
  if (e.state) {
    this.outputs.press.set();
  } else {
    this.outputs.release.set();
  }

  this.outputs.state.set(e.state);
};

exports.Node = Switch;
