
module.exports.setup = function(e) {
  e.context.state = e.props.initialState;
};

module.exports.evaluate = function(e) {
  var inputs = e.inputs;
  var ctx = e.context;
  if (inputs.toggle) {
    return (ctx.state = !ctx.state);
  } else if (inputs.set) {
    return (ctx.state = true);
  } else /* if (inputs.reset) */ {
    return (ctx.state = false);
  }
};
