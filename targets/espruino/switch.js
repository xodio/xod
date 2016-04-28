
var Node = require('@xod/impl/node');

var Switch = function(meta) {
  Node.call(this, meta);
  setWatch(this._onTrigger.bind(this), P8, {repeat: true, debounce: 30});
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

exports = Switch;
