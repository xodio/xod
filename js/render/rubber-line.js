
export default class RubberLine {
  constructor(canvas, pos) {
    this._points = [pos, pos];
    this._path = canvas.appendClassed('path.rubber-line');
    this.render();
  }

  remove() {
    this._path.remove();
  }

  render() {
    this._path.attr('d', this._lineData());
  }

  targetPoint(pos) {
    this._points[1] = pos;
    this.render();
  }

  _lineData() {
    return [
      'M',
      this._points[0].x,
      this._points[0].y,
      'L',
      this._points[1].x,
      this._points[1].y,
    ].join(' ');
  }
};
