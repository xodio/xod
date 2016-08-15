
module.exports.setup = function(e) {
  e.context.pin = new Pin(e.props.pin);
};

module.exports.evaluate = function(e) {
  const minPulse = +e.props.minPulse;
  const maxPulse = +e.props.maxPulse;
  const us = minPulse + (maxPulse - minPulse) * e.inputs.value;
  analogWrite(e.context.pin, us / 20000, { freq: 50 });
};
