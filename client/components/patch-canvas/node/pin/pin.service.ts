import {Injectable} from '@angular/core';
import {PinModel, PinType} from './pin.model.ts';

@Injectable()
export class PinService {
  private _pins = new Map<number, PinModel>();
  private _selected: PinModel = null;
  private count: number = 0;

  constructor() {
  }

  pins() {
    const pins: Array<PinModel> = [];
    const iterator = this._pins.values();
    let value = iterator.next();
    while(!value.done) {
      pins.push(value.value);
      value = iterator.next();
    }
    return pins;
  }

  pinsIds(nodeId: number): Array<number> {
    return this.pins().map(pin => pin.pinId);
  }

  pinsOfNode(nodeId: number): Array<PinModel> {
    return this.pins().filter(pin => pin.nodeId === nodeId);
  }

  inputPinsIds(nodeId: number): Array<number> {
    return this.pinsOfNode(nodeId).filter(pin => pin.type === PinType.Input).map(pin => pin.pinId);
  }

  outputPinsIds(nodeId: number): Array<number> {
    return this.pinsOfNode(nodeId).filter(pin => pin.type === PinType.Output).map(pin => pin.pinId);
  }

  pin(id: number): PinModel {
    return this._pins.get(id);
  }

  // TODO: implement pin validation: it should not be selected
  select(pin: PinModel): PinModel {
    this._selected = pin;
    return pin;
  }

  isSelected(pin: PinModel) {
    return this._selected && pin && this._selected.pinId === pin.pinId;
  }

  resolve(pinId: number) {
    return this._pins[pinId];
  }

  reserveId(): number {
    return this.count++;
  }

  createPin(pin: PinModel) {
    this._pins.set(pin.pinId, pin);
    return pin;
  }

  deselect() {
    this._selected = null;
  }

  selected() {
    return this._selected;
  }

  somePinSelected() {
    return !!this._selected;
  }
}
