
module.exports.setup = function(e) {
  e.context.pin = new Pin(e.props.pin);
};

module.exports.evaluate = function(e) {
  var ms = 600 + (2400 - 600) * e.inputs.value;
  analogWrite(e.context.pin, ms / 20, { freq: 50 });
};
