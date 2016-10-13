
module.exports.setup = function(e) {
  e.context.intId = null;
};

module.exports.evaluate = function(e) {
  if (e.context.intId) {
    clearInterval(e.context.intId);
  }
  e.context.intId = setInterval(function() {
    e.fire({ tick: PULSE });
  }, e.inputs.interval * 1000);
};
