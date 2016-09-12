
module.exports.setup = function(e) {
  e.context.pin = new Pin(e.props.pin);
};

module.exports.evaluate = function(e) {
   return { value: analogRead(e.context.pin) };
};
