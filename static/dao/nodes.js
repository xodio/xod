
var AjaxNodeRepository = function() {
  this._urlTemplate = '/nodes/{type}.json5';
  this._nodeTypes = {};
};

AjaxNodeRepository.prototype.get = function(type) {
  return this._nodeTypes[type];
};

AjaxNodeRepository.prototype._prefetchOne = function(type, callback) {
  if (this._nodeTypes[type]) {
    callback(null, this._nodeTypes[type]);
    return;
  }

  let url = this._urlTemplate.replace('{type}', type.replace('core.', ''));
  d3.xhr(url, (err, xhr) => {
    let json = JSON5.parse(xhr.responseText);
    this._nodeTypes[type] = json;
    callback(err, json);
  });
};

AjaxNodeRepository.prototype.prefetch = function(types, callback) {
  var n = types.length;

  if (n === 0) {
    callback();
    return;
  }

  types.forEach((type) => {
    this._prefetchOne(type, (err, data) => {
      if (--n === 0) {
        callback();
      }
    });
  });
};
