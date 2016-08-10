
module.exports.setup = function(e) {
  var pin = new Pin(e.props.pin);

  setWatch(function(e) {
    e.fire({state: e.state});
  }, pin, {edge: 'both'});
};
