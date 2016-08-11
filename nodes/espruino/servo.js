
module.exports.setup = function(e) {
  e.context.pin = new Pin(e.props.pin);
};

module.exports.evaluate = function(e) {
  var us = 600 + (2400 - 600) * e.inputs.value;
  analogWrite(e.context.pin, us / 20000, { freq: 50 });
};
