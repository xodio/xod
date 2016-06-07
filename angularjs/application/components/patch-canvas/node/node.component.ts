import {Component, ElementRef, Input} from '@angular/core';
import {NodeModel} from './node.model.ts';
import * as d3 from 'd3';
import {EditorMessage, EditorBus} from '../../editor/editor.bus.ts';
import {Point} from '../geometry/geometry.lib.ts';

@Component({
  selector: '[node]',
  template: require('./node.component.html')
})
export class NodeComponent {
  @Input() model: NodeModel;

  private element: HTMLElement;

  constructor(element: ElementRef, private bus: EditorBus) {
    this.element = element.nativeElement;
    this.element.style.fill = 'red';
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
      .on('dragstart', function() { rect.style('fill', 'lightblue'); (<any>d3.event).sourceEvent.stopPropagation();})
      .on('drag', function() {
        if (pointerPosition === null) {
          pointerPosition = new Point((<DragEvent>d3.event).x, (<DragEvent>d3.event).y);
        } else {
          model.bbox.min.x += (<DragEvent>d3.event).x - pointerPosition.x;
          model.bbox.min.y += (<DragEvent>d3.event).y - pointerPosition.y;

          pointerPosition.x = (<DragEvent>d3.event).x;
          pointerPosition.y = (<DragEvent>d3.event).y;
        }
        (<any>d3.event).sourceEvent.stopPropagation();
      })
      .on('dragend', function() { rect.style('fill', 'red'); pointerPosition = null; (<any>d3.event).sourceEvent.stopPropagation();});

    element.on("click", () => {
      // this.service.select(this.model);
      this.bus.send(new EditorMessage('select-node', this.model));
      (<any>d3.event).stopPropagation()
    });

    element.call(drag);
  }

  transform() {
    return `translate(${this.model.bbox.min.x}, ${this.model.bbox.min.y})`;
  }
}
