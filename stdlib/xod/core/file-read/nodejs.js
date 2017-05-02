var path = require('path');
var fs = require('fs');

module.exports.evaluate = function(e) {
  var filename = e.inputs.fileName;

  fs.readFile(filename, function (err, data) {
    if (err) {
      e.fire({ error: err.toString() });
      return;
    }

    e.fire({ data: data });
  });
};
