export class Point {
  constructor(public x: number, public y: number) {
  }
}

export class Rect {
  constructor(public min: Point, public max: Point) {
  }

  width() {
    return this.max.x - this.min.x;
  }

  height() {
    return this.max.y - this.min.y;
  }

  center() {
    return new Point(this.min.x + this.width() / 2, this.min.y + this.height() / 2);
  }
}
