import {Component, ElementRef, Input} from '@angular/core';
import {NgFor} from '@angular/common';
import * as d3 from 'd3';
import {PatchModel} from './patch.model.ts';
import {NodeComponent} from '../node/node.component.ts';

@Component({
  selector: '[patch]',
  template: require('./patch.component.html'),
  directives: [NgFor, NodeComponent],
  inputs: ['model']
})
export class PatchComponent {
  @Input() model: PatchModel;

  private element: HTMLElement;

  constructor(element: ElementRef) {
    this.element = element.nativeElement;
  }

  ngOnInit() {
    this.draw();
  }

  draw() {
    const element = d3.selectAll('.patch-component').select('rect');
    const drag = d3.behavior.drag()
      .on('dragstart', function() { element.style('fill', 'lightblue'); })
      .on('drag', function() { element.attr('width', (<DragEvent>d3.event).x).attr('height', (<DragEvent>d3.event).y); })
      .on('dragend', function() { element.style('fill', 'lightgray'); });
    element.call(drag);
  }

  position() {
    return `translate(100, 100)`;
  }
}