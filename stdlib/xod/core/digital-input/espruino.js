
module.exports.setup = function(e) {
  e.inputs.pin = new Pin(e.inputs.pin);

  setWatch(function(evt) {
    e.fire({ state: !evt.state });
  }, e.inputs.pin, {
    edge: 'both',
    repeat: true,
    debounce: 30
  });
};
