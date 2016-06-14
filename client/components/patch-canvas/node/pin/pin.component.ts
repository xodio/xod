import {Component, ElementRef, Input, provide} from '@angular/core';
import {EditorMessage, EditorBus} from '../../../editor/editor.bus.ts';
import {Point} from '../../geometry/geometry.lib.ts';
import {PinModel, PinType} from './pin.model.ts';
import {NodeService} from '../node.service.ts';
import {PinService} from "./pin.service.ts";
import {SampleNodeService} from "../node.sample.service.ts";
import {SamplePinService} from "./pin.sample.service.ts";

@Component({
  selector: '[pin]',
  template: require('./pin.component.html'),
  directives: [],
  styles: [],
  providers: [
    provide(NodeService, {
      useExisting: SampleNodeService
    }),
    provide(PinService, {
      useExisting: SamplePinService
    })
  ]
})
export class PinComponent {
  @Input() pinId: number;
  private model: PinModel;
  private element: HTMLElement;

  constructor(element: ElementRef, private bus: EditorBus, private nodeService: NodeService, private pinService: PinService) {
    this.element = element.nativeElement;
  }

  ngOnInit() {
    if (this.pinService) {
      this.model = this.pinService.pin(this.pinId);
    }
  }

  pinPosition() {
    const node = this.nodeService.node(this.model.nodeId);
    switch (this.model.type) {
      case PinType.Input:
        return new Point((this.model.position + 1) * node.bbox.width() / (node.inputPinsIds.length + 1), 0);
      case PinType.Output:
        return new Point((this.model.position + 1) * node.bbox.width() / (node.outputPinsIds.length + 1), node.bbox.height());
    }
  }

  labelTransform() {
    switch(this.model.type) {
      case PinType.Input:
        return 'rotate(-90) translate(8, 16)';
      case PinType.Output:
        return 'rotate(-90) translate(-20, 16)';
    }
  }

  transform() {
    const position = this.pinPosition();
    return `translate(${position.x}, ${position.y})`;
  }
}
