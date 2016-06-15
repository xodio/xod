import {Component, ElementRef, Input, Inject, provide, forwardRef} from '@angular/core';
import {NgFor} from '@angular/common';

import {NodeTypeService} from './node-type.service.ts';
import {SampleNodeTypeService} from './node-type.sample.service.ts';

@Component({
  selector: 'node-type',
  template: require('./node-type.component.html'),
  directives: [NgFor],
  providers: [
    provide(NodeTypeService, {
      useExisting: SampleNodeTypeService
    })
  ]
})
export class NodeTypeComponent {
  private types: any;
  private element: HTMLElement;

  constructor(
    element: ElementRef,
    @Inject(forwardRef(() => NodeTypeService)) private service: NodeTypeService
  ) {
    this.element = element.nativeElement;

    this.types = this.service.types();

    if(this.types.length) {
      this.service.setSelected(this.types[0]);
    }
  }

  ngOnInit() {
  }

  
  onTypeChanged(event: any) {
    const val = event.target.value;

    this.service.setSelected(val);
  }
}
