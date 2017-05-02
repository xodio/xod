module.exports.evaluate = function(e) {
  return { result: (String(e.inputs.a) + String(e.inputs.b)) };
};
