
module.exports.evaluate = function(e) {
  digitalWrite(e.inputs.pin, e.inputs.value);
};
