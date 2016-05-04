
d3.selection.prototype.appendClassed =
d3.selection.enter.prototype.appendClassed = function(selector) {
  let parts = selector.split('.');
  let name = parts[0];
  let classes = parts.splice(1);
  return this.append(name).attr('class', classes.join(' '));
};

d3.selection.prototype.translate =
d3.selection.enter.prototype.translate = function(pos) {
  var alignPixel = (x) => Math.floor(x) + 0.5;
  return this.attr('transform', 'translate(' + alignPixel(pos.x) + ', ' + alignPixel(pos.y) + ')');
};
