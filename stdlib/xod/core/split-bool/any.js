
module.exports.evaluate = function(e) {
  if (e.inputs.inp) {
    return { outTrue: PULSE };
  } else {
    return { outFalse: PULSE };
  }
};
