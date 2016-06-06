import {Component, ElementRef, Input} from '@angular/core';
import {NgFor, NgStyle} from '@angular/common';
import * as d3 from 'd3';
import {PatchModel} from './patch.model.ts';
import {NodeComponent} from '../node/node.component.ts';
import {Point} from '../geometry/geometry.lib.ts';
import {TextComponent} from '../text/text.component.ts';
import {PatchService} from './patch.service.ts';

@Component({
  selector: '[patch]',
  template: require('./patch.component.html'),
  directives: [NgFor, NodeComponent, TextComponent],
  inputs: ['model'],
})
export class PatchComponent {
  @Input() model: PatchModel;

  private element: HTMLElement;
  private zeroPoint: Point;

  constructor(element: ElementRef, private service: PatchService) {
    this.element = element.nativeElement;
    this.zeroPoint = new Point(0, 0);
  }

  ngOnInit() {
    this.draw();
  }

  draw() {
    const rect = d3.select(this.element)
      .select('rect')
      .attr('width', this.model.bbox.width())
      .attr('height', this.model.bbox.height());

    const element = d3.select(this.element);
    const model = this.model;

    let pointerPosition = null;

    const drag = d3.behavior.drag()
      .on('dragstart', function() { rect.style('fill', 'lightblue'); })
      .on('drag', function() {
        if (pointerPosition === null) {
          pointerPosition = new Point((<DragEvent>d3.event).x, (<DragEvent>d3.event).y);
        } else {
          model.bbox.min.x += (<DragEvent>d3.event).x - pointerPosition.x;
          model.bbox.min.y += (<DragEvent>d3.event).y - pointerPosition.y;

          pointerPosition.x = (<DragEvent>d3.event).x;
          pointerPosition.y = (<DragEvent>d3.event).y;
        }
      })
      .on('dragend', function() { rect.style('fill', 'lightgray'); pointerPosition = null; });

    element.on("click", () => {
      this.service.select(this.model);
      // TODO: implement response propagation
      (<any>d3.event).stopPropagation();
    });

    element.call(drag);
  }

  position() {
    return `translate(${this.model.bbox.min.x}, ${this.model.bbox.min.y})`;
  }

  selected() {
    return this.service.isSelected(this.model);
  }
}
