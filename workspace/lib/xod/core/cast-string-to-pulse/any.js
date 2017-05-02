
module.exports.evaluate = function(e) {
  if (Boolean(e.inputs.__in__) === false) return;

  return { __out__: PULSE };
};
