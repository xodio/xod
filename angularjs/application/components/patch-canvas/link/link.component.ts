import {Component, ElementRef, Input, EventEmitter, Output} from '@angular/core';
import {NgFor} from '@angular/common';
import * as d3 from 'd3';
import {Point, Rect} from '../geometry/geometry.lib.ts';
import {PinService} from '../node/pin/pin.service.ts';
import {EditorMessage, EditorBus} from '../../editor/editor.bus.ts';
import {LinkModel} from './link.model.ts';
import {LinkService} from './link.service.ts';
import {PinModel, PinType} from "../node/pin/pin.model.ts";

@Component({
  selector: '[link]',
  template: require('./link.component.html'),
  directives: [NgFor, LinkComponent],
  inputs: ['model']
})
export class LinkComponent {
  @Input() linkId: number;

  private element: HTMLElement;
  private zeroPoint: Point;

  constructor(element: ElementRef, private bus: EditorBus, private linkService: LinkService, private pinService: PinService) {
    this.element = element.nativeElement;
    this.zeroPoint = new Point(0, 0);
  }

  ngOnInit() {
    this.draw();
  }

  draw() {
    const element = d3.select(this.element);
  }

  resolveInput() {
    return null;
  }

  resolveOutput() {
    return null;
  }
}
