import {Component, ElementRef, Input} from '@angular/core';
import {EditorMessage, EditorBus} from '../../../editor/editor.bus.ts';
import {Point} from '../../geometry/geometry.lib.ts';
import {PinModel, PinType} from './pin.model.ts';
import {NodeService} from '../node.service.ts';

@Component({
  selector: '[pin]',
  template: require('./pin.component.html'),
  directives: [],
  styles: [require('./pin.component.styl')]
})
export class PinComponent {
  @Input() model: PinModel;
  private element: HTMLElement;

  constructor(element: ElementRef, private bus: EditorBus, private nodeService: NodeService) {
    this.element = element.nativeElement;
  }

  pinPosition() {
    const node = this.nodeService.node(this.model.nodeId);
    switch (this.model.type) {
      case PinType.Input:
        return new Point((this.model.position + 1) * node.bbox.width() / (node.inputs.length + 1), 0);
      case PinType.Output:
        return new Point((this.model.position + 1) * node.bbox.width() / (node.outputs.length + 1), node.bbox.height());
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
