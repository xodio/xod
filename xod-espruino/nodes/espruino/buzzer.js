
module.exports.setup = function(e) {
  e.context.pin = new Pin(e.props.pin);
};

module.exports.evaluate = function(e) {
  var f = e.inputs.freq;

  if (f === 0) {
    digitalWrite(e.context.pin, false);
  } else {
    analogWrite(e.context.pin, 0.5, { freq: f });
  }
};
