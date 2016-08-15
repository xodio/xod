
module.exports.evaluate = function(e) {
  var inputs = e.inputs;
  var k = (inputs.inp - inputs.inA) / (inputs.inB - inputs.inA);
  var out = inputs.outA + k * (inputs.outB - inputs.outA);

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
