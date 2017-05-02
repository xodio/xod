
module.exports.setup = function(e) {
  var pin = new Pin(e.props.pin);

  setWatch(function(evt) {
    e.fire({ state: !evt.state });
  }, pin, {
    edge: 'both',
    repeat: true,
    debounce: 30
  });
};
