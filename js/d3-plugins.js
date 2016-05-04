
d3.selection.prototype.appendClassed =
d3.selection.enter.prototype.appendClassed = function(selector) {
  let parts = selector.split('.');
  let name = parts[0];
  let classes = parts.splice(1);
  return this.append(name).attr('class', classes.join(' '));
};
