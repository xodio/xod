
module.exports.setup = function(e) {
  e.context.pin = new Pin(e.props.pin);
};

module.exports.evaluate = function(e) {
  var b = e.inputs.brightness;
  b = b * b * b;
  analogWrite(e.context.pin, b);
};
