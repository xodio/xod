import {Component, ElementRef, Input, Inject, EventEmitter, Output, provide, forwardRef} from '@angular/core';
import {NgIf, NgFor} from '@angular/common';
import * as d3 from 'd3';
import {PatchModel} from './patch.model.ts';
import {NodeComponent} from '../node/node.component.ts';
import {Point, Rect} from '../geometry/geometry.lib.ts';
import {TextComponent} from '../text/text.component.ts';
import {PatchService} from './patch.service.ts';
import {EditorMessage, EditorBus} from '../../editor/editor.bus.ts';
import {NodeService} from '../node/node.service.ts';
import {NodeModel} from '../node/node.model.ts';
import {PinModel, PinType} from "../node/pin/pin.model.ts";
import {LinkComponent} from '../link/link.component.ts';
import {LinkModel} from '../link/link.model.ts';
import {LinkService} from '../link/link.service.ts';
import {PinService} from '../node/pin/pin.service.ts';
import {SampleNodeService} from "../node/node.sample.service.ts";
import {SampleLinkService} from "../link/link.sample.service.ts";
import {SamplePinService} from '../node/pin/pin.sample.service.ts';
import {SamplePatchService} from "./patch.sample.service.ts";

@Component({
  selector: '[patch]',
  template: require('./patch.component.html'),
  directives: [NgFor, NgIf, LinkComponent, TextComponent, NodeComponent],
  inputs: ['model'],
  providers: [
    provide(PatchService, {
      useExisting: SamplePatchService
    }),
    provide(NodeService, {
      useExisting: SampleNodeService
    })
  ]
})
export class PatchComponent {
  @Input() patchId: number;

  private model: PatchModel = null;
  private element: HTMLElement;
  private zeroPoint: Point;

  constructor(element: ElementRef, @Inject(forwardRef(() => PatchService)) private patchService: PatchService, private bus: EditorBus, @Inject(forwardRef(() => NodeService)) private nodeService: NodeService) {
    console.log('patch');
    console.log(this.nodeService);
    this.element = element.nativeElement;
    this.zeroPoint = new Point(0, 0);

    this.bus.listen('update-patch', (message: EditorMessage): void => {
      if (this.selected()) {
        this.model = <PatchModel>message.body;
      }
    });
  }

  ngOnInit() {
    console.log(this.patchId);
    this.model = this.resolvePatch();
    if (!!this.model && this.nodeService) {
      this.model.nodesIds = this.nodeService.nodesIds(this.patchId);
      console.log('this.model');
      console.log(this.model);
      this.bus.send(new EditorMessage('select-patch', this.model));
      this.draw();
    }
  }

  draw() {
    this.model = this.resolvePatch();
    const element = d3.select(this.element);
    const model = this.model;
    const rect = d3.select(this.element).select('rect');

    let pointerPosition = null;
  }

  createNode(event: any) {
    const bbox = new Rect(new Point(event.offsetX, event.offsetY), new Point(event.offsetX + 50, event.offsetY + 50));
    let node = new NodeModel(this.nodeService.reserveId(), this.patchId, bbox, "Node", [], []);
    this.nodeService.create(node);
    this.model.nodesIds = this.nodeService.nodesIds(this.patchId);
    this.bus.send(new EditorMessage('update-patch', this.patchService.patch(this.patchId)));
  }

  position() {
    return `translate(${this.model.bbox.min.x}, ${this.model.bbox.min.y})`;
  }

  selected() {
    if (this.model) {
      return this.patchService.isSelected(this.model);
    }
  }

  resolvePatch() {
    if (this.patchService) {
      const patch = this.patchService.resolve(this.patchId);
      return patch;
    } else {
      return null;
    }
  }
}
