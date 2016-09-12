
module.exports.evaluate = function(e) {
  var a = e.inputs.a;
  var b = e.inputs.b;
  if (a < b) {
    return { less: PULSE };
  } else if (a > b) {
    return { greater: PULSE };
  } else {
    return { equal: PULSE };
  };
};
