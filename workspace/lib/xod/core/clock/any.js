module.exports.setup = function(e) {
  e.context.intervalID = null;
};
module.exports.evaluate = function(e) {
  if (e.context.intervalID) {
    clearInterval(e.context.intervalID);
  }

  e.context.intervalID = setInterval(function() {
    e.fire({ TICK: PULSE });
  }, e.inputs.IVAL * 1000);
};
