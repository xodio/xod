
module.exports.evaluate = function(e) {
  if (e.inputs.cond) {
    e.fire({ out: e.inputs.in });
  }
};
