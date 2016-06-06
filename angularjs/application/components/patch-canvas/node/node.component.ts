import {Component, ElementRef, Input} from '@angular/core';
import {NodeModel} from './node.model.ts';

@Component({
  selector: '[node]',
  template: require('./node.component.html')
})
export class NodeComponent {
  @Input() model: NodeModel;

  private element: HTMLElement;

  constructor(element: ElementRef) {
    this.element = element.nativeElement;
    this.element.style.fill = 'red';
  }
}