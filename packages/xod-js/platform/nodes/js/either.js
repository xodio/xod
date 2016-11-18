
module.exports.evaluate = function(e) {
  var out = e.inputs.inp ? e.inputs.trueValue : e.inputs.falseValue;
  return { out: out };
};
