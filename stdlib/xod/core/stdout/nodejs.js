module.exports.evaluate = function(e) {
  var val = String(e.inputs.value);
  process.stdout.write(val);
};
