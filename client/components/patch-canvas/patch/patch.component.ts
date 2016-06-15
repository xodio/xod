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
import {NodeTypeService} from "../node-type/node-type.service.ts";
import {SampleNodeTypeService} from "../node-type/node-type.sample.service.ts";

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
    }),
    provide(LinkService, {
      useExisting: SampleLinkService
    }),
    // @TODO: In the near future we don't have to need inject nodeTypeService here.
    //        It would be better to subscribe on "selectedNodeTypeChanged" and
    //        update private nodeTypeId, that will be used in createNode.
    provide(NodeTypeService, {
      useExisting: SampleNodeTypeService
    })
  ]
})
export class PatchComponent {
  @Input() patchId: number;

  private model: PatchModel = null;
  private element: HTMLElement;
  private zeroPoint: Point;

  constructor(
    element: ElementRef,
    private bus: EditorBus,
    @Inject(forwardRef(() => PatchService)) private patchService: PatchService,
    @Inject(forwardRef(() => NodeService)) private nodeService: NodeService,
    @Inject(forwardRef(() => LinkService)) private linkService: LinkService,
    @Inject(forwardRef(() => NodeTypeService)) private nodeTypeService: NodeTypeService
  ) {
    this.element = element.nativeElement;
    this.zeroPoint = new Point(0, 0);

    this.bus.listen('create-link', (id: EditorMessage): void => {
      setTimeout(_=>{
        this.model.linksIds = this.linkService.linksIds(this.patchId);
        console.log(this.model.linksIds);
      }, 0);
    });
  }

  ngAfterViewInit() {
    setTimeout(_=>{
      this.model = this.resolvePatch();
      this.model.nodesIds = this.nodeService.nodesIds(this.patchId);
      this.model.linksIds = this.linkService.linksIds(this.patchId);
      console.log(this.model.linksIds);
      this.bus.send(new EditorMessage('select-patch', this.model));
    });
  }

  // @TODO: Rewrite this method:
  createNode(event: any) {
    const position = new Point(event.offsetX, event.offsetY);
    const nodeType = this.nodeTypeService.selected();
    const label = nodeType.label || "Node";
    let node = new NodeModel(this.nodeService.reserveId(), this.patchId, position, label, [], [], nodeType.id);

    this.nodeService.create(node);
    this.model.nodesIds = this.nodeService.nodesIds(this.patchId);
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
