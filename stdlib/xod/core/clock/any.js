
module.exports.evaluate = function(e) {
  if (e.context.intervalID) {
    clearInterval(e.context.intervalID);
  }

  e.context.intervalID = setInterval(function() {
    e.fire({ tick: PULSE });
  }, e.inputs.interval * 1000);
};
