
var sonic = require('@amperka/ultrasonic');

module.exports.setup = function(e) {
  var pinTrig = new Pin(e.props.pinTrig);
  var pinEcho = new Pin(e.props.pinEcho);
  e.context.device = sonic.connect({
    trigPin: pinTrig,
    echoPin: pinEcho,
  });
  e.context.units = e.props.units;
  e.context.isBusy = false;
};

module.exports.evaluate = function(e) {
  if (e.context.isBusy) {
    e.fire({ error: "busy" });
  } else {
    e.context.isBusy = true;
    e.context.device.ping(function(err, value) {
      e.context.isBusy = false;
      if (err) {
        e.fire({ error: err.msg });
      } else {
        e.fire({ value: value });
      }
    }, e.context.units);
  }
};
