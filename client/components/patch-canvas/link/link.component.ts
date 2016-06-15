import {Inject, Component, ElementRef, Input, EventEmitter, Output, provide, forwardRef} from '@angular/core';
import {NgFor, NgIf} from '@angular/common';
import * as d3 from 'd3';
import {Point, Rect} from '../geometry/geometry.lib.ts';
import {PinService} from '../node/pin/pin.service.ts';
import {EditorMessage, EditorBus} from '../../editor/editor.bus.ts';
import {LinkModel, LinkPosition} from './link.model.ts';
import {LinkService} from './link.service.ts';
import {PinModel, PinType} from "../node/pin/pin.model.ts";
import {SamplePinService} from "../node/pin/pin.sample.service.ts";
import {SampleNodeService} from "../node/node.sample.service.ts";
import {NodeService} from "../node/node.service.ts";
import {SampleLinkService} from "./link.sample.service.ts";

@Component({
  selector: '[link]',
  template: require('./link.component.html'),
  directives: [NgFor, LinkComponent, NgIf],
  inputs: ['linkId'],
  providers: [
    provide(PinService, {
      useExisting: SamplePinService
    }),
    provide(LinkService, {
      useExisting: SampleLinkService
    }),
    provide(NodeService, {
      useExisting: SampleNodeService
    })
  ]
})
export class LinkComponent {
  @Input() linkId: number;

  private model: LinkModel;

  private element: HTMLElement;
  private zeroPoint: Point;
  private _position: LinkPosition;

  constructor(element: ElementRef, private bus: EditorBus, @Inject(forwardRef(() => NodeService)) private nodeService: NodeService, @Inject(forwardRef(() => LinkService)) private linkService: LinkService, @Inject(forwardRef(() => PinService)) private pinService: PinService) {
    this.element = element.nativeElement;
    this.zeroPoint = new Point(0, 0);
    this._position = new LinkPosition(new Point(0, 0), new Point(0, 0));
  }

  ngOnInit() {
    setTimeout(_=>{
      this.model = this.linkService.link(this.linkId);
      this.bus.send(new EditorMessage('create-link', this.linkId));
    });
  }

  position() {
    const input = this.pinService.pin(this.model.inputPinId);
    const output = this.pinService.pin(this.model.outputPinId);
    const inputNode = this.nodeService.node(input.nodeId);
    const outputNode = this.nodeService.node(output.nodeId);
    inputNode.inputPinsIds = this.pinService.inputPinsIds(input.nodeId);
    inputNode.outputPinsIds = this.pinService.outputPinsIds(input.nodeId);
    outputNode.inputPinsIds = this.pinService.inputPinsIds(output.nodeId);
    outputNode.outputPinsIds = this.pinService.outputPinsIds(output.nodeId);
    this._position.input = input.center(inputNode.inputPinsIds.length, inputNode.outputPinsIds.length, inputNode.bbox.width(), inputNode.bbox.height());
    this._position.output = output.center(outputNode.inputPinsIds.length, outputNode.outputPinsIds.length, outputNode.bbox.width(), outputNode.bbox.height());
    return this._position;
  }
}
