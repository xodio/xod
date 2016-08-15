
module.exports.evaluate = function(e) {
  const inputs = e.inputs;
  const k = (inputs.inp - inputs.inA) / (inputs.inB - inputs.inA);

  let out = inputs.outA + k * (inputs.outB - inputs.outA);

  if (inputs.clip) {
    if (inputs.outB > inputs.outA) {
      out = Math.max(inputs.outA, out);
      out = Math.min(inputs.outB, out);
    } else {
      out = Math.max(inputs.outB, out);
      out = Math.min(inputs.outA, out);
    }
  }

  return { out: out };
};
