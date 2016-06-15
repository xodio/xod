import {Component, ElementRef, Input, provide, forwardRef, Inject} from '@angular/core';
import {EditorMessage, EditorBus} from '../../../editor/editor.bus.ts';
import {Point} from '../../geometry/geometry.lib.ts';
import {PinModel, PinType} from './pin.model.ts';
import {NodeService} from '../node.service.ts';
import {PinService} from "./pin.service.ts";
import {SampleNodeService} from "../node.sample.service.ts";
import {SamplePinService} from "./pin.sample.service.ts";
import {LinkService} from "../../link/link.service.ts";
import {SampleLinkService} from "../../link/link.sample.service.ts";
import {LinkModel} from "../../link/link.model.ts";

@Component({
  selector: '[pin]',
  template: require('./pin.component.html'),
  directives: [],
  styles: [require('./pin.component.styl')],
  providers: [
    provide(NodeService, {
      useExisting: SampleNodeService
    }),
    provide(PinService, {
      useExisting: SamplePinService
    }),
    provide(LinkService, {
      useExisting: SampleLinkService
    })
  ]
})
export class PinComponent {
  @Input() pinId: number;
  private model: PinModel;
  private element: HTMLElement;

  constructor(element: ElementRef, private bus: EditorBus, @Inject(forwardRef(() => NodeService)) private nodeService: NodeService, @Inject(forwardRef(() => PinService)) private pinService: PinService, @Inject(forwardRef(() => LinkService)) private linkService: LinkService) {
    this.element = element.nativeElement;
  }

  ngAfterViewInit() {
    setTimeout(_=> {
      this.model = this.pinService.pin(this.pinId);
      this.element.addEventListener("click", () => {
        // Something selected
        if (this.pinService.somePinSelected()) {
          // in this case we are trying creating a link between selected pin and clicked pin
          if (this.linkService.create(new LinkModel(this.linkService.reserveId(), this.nodeService.node(this.model.nodeId).patchId, this.pinService.selected().pinId, this.pinId))) {
            this.bus.send(new EditorMessage('create-link', this.nodeService.node(this.model.nodeId).patchId));
            // in case of our success we deselect selected pin
            this.pinService.deselect();
          } else {
            // in case of our failure we selected clicked pin
            this.pinService.deselect();
            this.pinService.select(this.model);
          }
        } else {
          // or not
          // in this case we select clicked pin
          this.pinService.select(this.model);
        }
      }, true);
    });
  }

  pinPosition() {
    const node = this.nodeService.node(this.model.nodeId);
    return this.model.pinPosition(node.inputPinsIds.length, node.outputPinsIds.length, node.bbox.width(), node.bbox.height());
  }

  labelTransform() {
    switch(this.model.type) {
      case PinType.Input:
        return 'rotate(-90) translate(8, 16)';
      case PinType.Output:
        return 'rotate(-90) translate(-20, 16)';
    }
  }

  onClick(event) {
  }

  transform() {
    const position = this.pinPosition();
    return `translate(${position.x}, ${position.y})`;
  }
}
