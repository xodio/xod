
module.exports.setup = function(e) {
  setInterval(function() {
    e.fire({ tick: PULSE });
  }, e.props.interval * 1000);
};
