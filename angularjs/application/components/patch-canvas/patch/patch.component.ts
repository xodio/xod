import {Component, ElementRef, Input, EventEmitter, Output} from '@angular/core';
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

@Component({
  selector: '[patch]',
  template: require('./patch.component.html'),
  directives: [NgFor, NodeComponent, TextComponent],
  inputs: ['model'],
  providers: [NodeService]
})
export class PatchComponent {
  @Input() model: PatchModel;
  @Output() onPatchSelect: EventEmitter<PatchModel> = new EventEmitter();

  private element: HTMLElement;
  private zeroPoint: Point;

  constructor(element: ElementRef, private service: PatchService, private bus: EditorBus, private nodeService: NodeService) {
    this.element = element.nativeElement;
    this.zeroPoint = new Point(0, 0);

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
        this.service.select(this.model);
        this.bus.send(new EditorMessage('select-patch', this.model));
      }
      (<any>d3.event).stopPropagation();
    });
  }

  position() {
    return `translate(${this.model.bbox.min.x}, ${this.model.bbox.min.y})`;
  }

  selected() {
    return this.service.isSelected(this.model);
  }

  onSelect() {
    this.service.select(this.model);
    this.onPatchSelect.emit(this.model);
  }

  createNode(event: any) {
    const point = new Point(event.offsetX, event.offsetY);
    const end = new Point(point.x + 100, point.y + 50);
    const node = this.nodeService.create(new NodeModel(null, this.model.id, new Rect(point, end), "Node", [new PinModel(0, 0, 0, "A", PinType.Input), new PinModel(1, 0, 1, "B", PinType.Input)], []));
    this.model.nodes = this.nodeService.nodes();
    this.bus.send(new EditorMessage('create-node', node));
  }
}
