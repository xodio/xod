import {Injectable} from '@angular/core';
import {PinModel, PinType} from './pin.model.ts';

@Injectable()
export class PinService {
  private _pins = new Map<String, PinModel>();
  private selected: PinModel = null;
  private count: number = 0;

  constructor() {
  }

  pins() {
    return this._pins;
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

  createPin(pin: PinModel) {
    this.pins()[this.count - 1] = pin;
    return pin;
  }
}
