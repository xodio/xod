import {Component, Input} from '@angular/core';
import {Point} from "../geometry/geometry.lib.ts";

@Component({
  selector: '[text]',
  template: require('./text.component.html'),
  styles: [require('./text.component.styl')],
  inputs: ['content', 'position']
})
export class TextComponent {
  @Input() content: string;
  @Input() position: Point;
  @Input() align: string;

  constructor() {
    this.content = "Text";
    this.position = new Point(0, 0);
    this.align = "right";
  }
}
