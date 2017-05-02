
module.exports.evaluate = function(e) {
  var a = e.inputs.a;
  var b = e.inputs.b;

  if (a === undefined || b === undefined) {
    return;
  }

  return { out: a === b };
};
