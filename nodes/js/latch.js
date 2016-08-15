
module.exports.setup = function(e) {
  e.context.state = e.props.initialState;
};

module.exports.evaluate = function(e) {
  const inputs = e.inputs;
  let newState;

  if (inputs.toggle) {
    newState = !e.context.state;
  } else if (inputs.set) {
    newState = true;
  } else /* if (inputs.reset) */ {
    newState = false;
  }

  e.context.state = newState;
  return { state: newState };
};
