import {Injectable} from '@angular/core';
import {PinModel, PinType} from './pin.model.ts';

@Injectable()
export class PinService {
  private _pins = new Map<number, PinModel>();
  private selected: PinModel = null;
  private count: number = 0;

  constructor() {
  }

  pins() {
    return this._pins;
  }

  pinsIds(nodeId: number) {
    return Object.keys(this._pins).filter(key => this._pins[key].nodeId === nodeId).map(key => this._pins[key].id);
  }

  inputPinsIds(nodeId: number) {
    return this.pinsIds(nodeId).filter(pinId => this._pins[pinId].type === PinType.Input);
  }

  outputPinsIds(nodeId: number) {
    return this.pinsIds(nodeId).filter(pinId => this._pins[pinId].type === PinType.Output);
  }

  pin(id: number) {
    return this.pins()[id];
  }

  select(pin: PinModel) {
    this.selected = pin;
  }

  isSelected(pin: PinModel) {
    return this.selected && pin && this.selected.id === pin.id;
  }

  resolve(pinId: number) {
    return this._pins[pinId];
  }

  reserveId(): number {
    return this.count++;
  }

  createPin(pin: PinModel) {
    this.pins()[pin.id] = pin;
    return pin;
  }
}
