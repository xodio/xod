import {Component, ElementRef, Input, Inject, provide, forwardRef} from '@angular/core';
import {NgFor} from '@angular/common';

import {NodeTypeService} from './node-type.service.ts';
import {SampleNodeTypeService} from './node-type.sample.service.ts';

@Component({
  selector: 'node-type',
  template: require('./node-type.component.html'),
  directives: [NgFor],
  providers: [
    SampleNodeTypeService
  ]
})
export class NodeTypeComponent {
  private types: any;

  private element: HTMLElement;

  constructor(
    element: ElementRef,
    @Inject(forwardRef(() => SampleNodeTypeService)) private service: SampleNodeTypeService
  ) {
    this.element = element.nativeElement;
    
    this.types = service.types();
  }

  ngOnInit() {
  }
}
