
module.exports.setup = function(e) {
  e.context.pin = new Pin(e.props.pin);
};

module.exports.evaluate = function(e) {
  e.fire({ value: analogRead(e.context.pin) });
  return analogRead(pin);
};
