import {Component, ElementRef, Input, EventEmitter, Output, provide} from '@angular/core';
import {NgFor} from '@angular/common';
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

@Component({
  selector: '[patch]',
  template: require('./patch.component.html'),
  directives: [NgFor, LinkComponent, TextComponent, NodeComponent],
  inputs: ['model'],
  providers: [
    provide(NodeService, {
      useClass: SampleNodeService
    }),
    provide(PinService, {
      useExisting: SamplePinService
    }),
    provide(LinkService, {
      useExisting: SampleLinkService
    })
  ]
})
export class PatchComponent {
  @Input() patchId: number;
  @Output() onPatchSelect: EventEmitter<PatchModel> = new EventEmitter();

  private model: PatchModel = null;
  private element: HTMLElement;
  private zeroPoint: Point;

  constructor(element: ElementRef, private patchService: PatchService, private bus: EditorBus, private nodeService: NodeService) {
    console.log('patch');
    this.element = element.nativeElement;
    this.zeroPoint = new Point(0, 0);

    this.model = this.patchService.resolve(this.patchId);

    this.bus.listen('update-patch', (message: EditorMessage): void => {
      if (this.selected()) {
        this.model = <PatchModel>message.body;
      }
    });
  }

  ngOnInit() {
    this.draw();
  }

  draw() {
    const element = d3.select(this.element);
    const model = this.model;
    const rect = d3.select(this.element).select('rect');

    let pointerPosition = null;

    element.on("click", () => {
      if (!this.selected()) {
        this.patchService.select(this.model);
        this.bus.send(new EditorMessage('select-patch', this.model));
      }
      (<any>d3.event).stopPropagation();
    });
  }

  position() {
    return `translate(${this.model.bbox.min.x}, ${this.model.bbox.min.y})`;
  }

  selected() {
    return this.patchService.isSelected(this.model);
  }

  onSelect() {
    this.patchService.select(this.model);
    this.onPatchSelect.emit(this.model);
  }

  resolvePatch() {
    return this.patchService.resolve(this.patchId);
  }
}
