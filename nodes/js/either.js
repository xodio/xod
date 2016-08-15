
module.exports.evaluate = function(e) {
  const out = e.inputs.inp ? e.inputs.trueValue : e.inputs.falseValue;
  return { out: out };
};
