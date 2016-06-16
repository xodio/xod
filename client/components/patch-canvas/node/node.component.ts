import {Component, ElementRef, Input, Inject, provide, forwardRef} from '@angular/core';
import {NgFor, NgIf} from '@angular/common';
import {NodeModel} from './node.model.ts';
import * as d3 from 'd3';
import {EditorMessage, EditorBus} from '../../editor/editor.bus.ts';
import {Point, Rect, Graphics} from '../geometry/geometry.lib.ts';
import {NodeService} from './node.service.ts';
import {PinComponent} from './pin/pin.component.ts';
import {PinService} from "./pin/pin.service.ts";
import {SamplePinService} from "./pin/pin.sample.service.ts";
import {SampleNodeService} from "./node.sample.service.ts";
import {NodeTypeService} from "../node-type/node-type.service.ts";
import {SampleNodeTypeService} from "../node-type/node-type.sample.service.ts";

@Component({
  selector: '[node]',
  template: require('./node.component.html'),
  directives: [PinComponent, NgFor, NgIf],
  styles: [require('./node.component.styl')],
  providers: [
    provide(NodeService, {
      useExisting: SampleNodeService
    }),
    provide(PinService, {
      useExisting: SamplePinService
    }),
    provide(NodeTypeService, {
      useExisting: SampleNodeTypeService
    })
  ]
})
export class NodeComponent {
  @Input() nodeId: number;
  private model: NodeModel;
  private category: number;

  private bbox: Rect;

  private element: HTMLElement;
  private zeroPoint: Point;

  constructor(
    element: ElementRef, 
    private bus: EditorBus,
    @Inject(forwardRef(() => NodeService)) private service: NodeService,
    @Inject(forwardRef(() => PinService)) private pinService: PinService,
    @Inject(forwardRef(() => NodeTypeService)) private nodeTypeService: NodeTypeService
  ) {

    this.element = element.nativeElement;
    this.zeroPoint = new Point(0, 0);
    this.category = 0;
    this.bbox = Graphics.getNodeBbox(this.zeroPoint);

    this.bus.listen('update-node', (message: EditorMessage) => {
      const node = <NodeModel>message.body;
      if (message.body.id === this.model.id && message.body.patchId === this.model.patchId) {
        this.model = node;
        this.updateCategory();
      }
    });
  }

  ngOnInit() {
    this.model = this.resolveNode();
    if (this.model) {
      this.bbox = Graphics.getNodeBbox(this.model.position);
      this.updateCategory();
      this.model.inputPinsIds = this.pinService.inputPinsIds(this.model.id);
      this.model.outputPinsIds = this.pinService.outputPinsIds(this.model.id);
      this.draw();
    }
  }

  draw() {
    const rect = d3.select(this.element)
      .select('rect')
      .attr('width', this.bbox.width())
      .attr('height', this.bbox.height());

    const element = d3.select(this.element);
    const model = this.model;
    const bbox = this.bbox;

    let pointerPosition = null;

    const drag = d3.behavior.drag()
      .on('dragstart', function() { rect.style('fill', 'lightblue'); (<any>d3.event).sourceEvent.stopPropagation();})
      .on('drag', function() {
        if (pointerPosition === null) {
          pointerPosition = new Point((<DragEvent>d3.event).x, (<DragEvent>d3.event).y);
        } else {
          bbox.min.x += (<DragEvent>d3.event).x - pointerPosition.x;
          bbox.min.y += (<DragEvent>d3.event).y - pointerPosition.y;

          bbox.max.x += (<DragEvent>d3.event).x - pointerPosition.x;
          bbox.max.y += (<DragEvent>d3.event).y - pointerPosition.y;

          pointerPosition.x = (<DragEvent>d3.event).x;
          pointerPosition.y = (<DragEvent>d3.event).y;
        }
        (<any>d3.event).sourceEvent.stopPropagation();
      })
      .on('dragend', function() { rect.style('fill', 'lightgray'); pointerPosition = null; (<any>d3.event).sourceEvent.stopPropagation();});

    element.on("click", () => {
      this.service.select(this.model);
      this.bus.send(new EditorMessage('select-node', this.model));
    });

    element.call(drag);
  }

  resolveNode() {
    if (this.service) {
      return this.service.resolveNode(this.nodeId);
    } else {
      return null;
    }
  }

  labelPosition() {
    return new Point(this.bbox.width() / 2, this.bbox.height() / 2);
  }

  selected() {
    return this.service.isSelected(this.model);
  }

  transform() {
    return `translate(${this.bbox.min.x}, ${this.bbox.min.y})`;
  }

  getClassNames() {
    let classNames = ['nodeRect'];

    if (this.selected()) {
      classNames.push('selected');
    }

    if (this.model.nodeTypeId !== 0) {
      classNames.push('node_type' + this.model.nodeTypeId);
      classNames.push('node_category' + this.category);
    }

    return classNames;
  }

  // @TODO: Node wouldn't know anything about NodeTypeService.
  //        Move it into NodeService.
  updateCategory() {
    let type = this.nodeTypeService.findById(this.model.nodeTypeId);
    let category = 0;

    if (type && type.category) {
      category = type.category;
    }

    this.category = category;
  }
}
