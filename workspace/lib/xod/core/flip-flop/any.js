module.exports.setup = function(e) {
  e.context.state = false;
};
module.exports.evaluate = function(e) {
  var state = e.context.state;
  var newState;

  if (e.inputs.TGL) {
    newState = !e.context.state;
  } else if (e.inputs.SET) {
    newState = true;
  } else {
    newState = false;
  }

  if (newState === state) return;

  e.context.state = newState;
  return { MEM: newState };
};
