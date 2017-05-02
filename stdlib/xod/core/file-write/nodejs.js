var path = require('path');
var fs = require('fs');

module.exports.evaluate = function(e) {
  var filename = e.inputs.fileName;
  var data = e.inputs.data;

  fs.writeFile(filename, data, function (err) {
    if (err) {
      e.fire({ onFailure: err.toString() });
      return;
    }

    e.fire({ onSuccess: PULSE });
  });
};
