
module.exports.evaluate = function(e) {
  if (e.inputs.__in__ === false) return;
  return { __out__: PULSE };
};
