
module.exports.evaluate = function(e) {
  if (e.inputs.a && e.inputs.b) {
    return { out: PULSE };
  }
};
