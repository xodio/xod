export class Point {
  constructor(public x: number, public y: number) {
  }

  add(shift: Point) {
    return new Point(this.x + shift.x, this.y + shift.y);
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

  translate(shift: Point) {
    return new Rect(this.min.add(shift), this.max.add(shift));
  }
}
