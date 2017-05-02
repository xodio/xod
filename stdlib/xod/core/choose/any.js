
module.exports.evaluate = function(e) {
  if (e.inputs.x) {
    return { truePulse: PULSE };
  } else {
    return { falsePulse: PULSE };
  }
};
