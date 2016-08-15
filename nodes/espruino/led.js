
module.exports.setup = function(e) {
  e.context.pin = new Pin(e.props.pin);
};

module.exports.evaluate = function(e) {
  var b = e.inputs.brightness;

  // Adjust duty cycle as a power function to align brightness
  // perception by human eye
  var duty = b * b * b;

  analogWrite(e.context.pin, duty);
};
