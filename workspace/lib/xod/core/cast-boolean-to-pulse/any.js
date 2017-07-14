module.exports.setup = function(e) {
  e.context.state = false;
};

module.exports.evaluate = function(e) {
  var state = e.context.state;
  var newValue = e.inputs.IN;

  e.context.state = newValue;

  if (!(newValue === true && state === false)) return {};

  return { OUT: PULSE };
};
