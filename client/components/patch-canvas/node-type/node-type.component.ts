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
  private _service: NodeTypeService;

  constructor(
    element: ElementRef,
    @Inject(forwardRef(() => SampleNodeTypeService)) private service: SampleNodeTypeService
  ) {
    this.element = element.nativeElement;
    this._service = service;

    this.types = this._service.types();

    if(this.types.length) {
      this._service.setSelected(this.types[0]);
    }
  }

  ngOnInit() {
  }

  
  onTypeChanged(event: any) {
    const val = event.target.value;

    this._service.setSelected(val);
  }
}
