import {Component, ElementRef, Input, Inject, forwardRef, provide} from '@angular/core';
import {NgFor} from '@angular/common';
import {NodeModel} from './node.model.ts';
import * as d3 from 'd3';
import {EditorMessage, EditorBus} from '../../editor/editor.bus.ts';
import {Point} from '../geometry/geometry.lib.ts';
import {TextComponent} from "../text/text.component.ts";
import {NodeService} from './node.service.ts';
import {PinComponent} from './pin/pin.component.ts';
import {PinModel} from './pin/pin.model.ts';
import {PinService} from './pin/pin.service.ts';
import {SampleLinkService} from "../link/link.sample.service.ts";
import {SamplePatchService} from "../patch/patch.sample.service.ts";
import {PatchService} from '../patch/patch.service.ts';
import {SampleNodeService} from "./node.sample.service.ts";
import {SampleNodeConfig} from './node.sample.config.ts';

@Component({
  selector: '[node]',
  template: require('./node.component.html'),
  directives: [TextComponent, PinComponent, NgFor],
  styles: [require('./node.component.styl')],
  providers: [
    provide(NodeService, {
      useExisting: SampleNodeService,
      deps: [
        PatchService, SampleNodeConfig
      ]
    })
  ]
})
export class NodeComponent {
  @Input() nodeId: number;
  private model: NodeModel;

  private element: HTMLElement;
  private zeroPoint: Point;

  constructor(element: ElementRef, private bus: EditorBus, private service: NodeService) {
    console.log('node');
    this.element = element.nativeElement;
    this.element.style.fill = 'red';
    this.zeroPoint = new Point(0, 0);

    this.bus.listen('update-node', (message: EditorMessage) => {
      const node = <NodeModel>message.body;
      if (message.body.id === this.model.id && message.body.patchId === this.model.patchId) {
        this.model = node;
      }
    });
  }

  ngOnInit() {
    this.draw();
  }

  draw() {
    const rect = d3.select(this.element)
      .select('rect')
      .attr('width', this.model.bbox.width())
      .attr('height', this.model.bbox.height());

    const element = d3.select(this.element);
    const model = this.model;

    let pointerPosition = null;

    const drag = d3.behavior.drag()
      .on('dragstart', function() { rect.style('fill', 'lightblue'); (<any>d3.event).sourceEvent.stopPropagation();})
      .on('drag', function() {
        if (pointerPosition === null) {
          pointerPosition = new Point((<DragEvent>d3.event).x, (<DragEvent>d3.event).y);
        } else {
          model.bbox.min.x += (<DragEvent>d3.event).x - pointerPosition.x;
          model.bbox.min.y += (<DragEvent>d3.event).y - pointerPosition.y;

          model.bbox.max.x += (<DragEvent>d3.event).x - pointerPosition.x;
          model.bbox.max.y += (<DragEvent>d3.event).y - pointerPosition.y;

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
    return this.service.resolveNode(this.nodeId);
  }

  labelPosition() {
    return new Point(this.model.bbox.width() / 2, this.model.bbox.height() / 2);
  }

  selected() {
    return this.service.isSelected(this.model);
  }

  transform() {
    return `translate(${this.model.bbox.min.x}, ${this.model.bbox.min.y})`;
  }
}
