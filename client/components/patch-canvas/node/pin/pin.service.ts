import {Injectable} from '@angular/core';
import {PinModel, PinType} from './pin.model.ts';

interface IPinServiceState {
  pins: Map<number, PinModel>,
  selected: PinModel,
  count: number
}

@Injectable()
export class PinService {
  private _state: IPinServiceState;

  constructor() {
    this._state = {
      pins: new Map<number, PinModel>(),
      selected: null,
      count: 0
    };
  }

  pins() {
    const pins: Array<PinModel> = [];
    const iterator = this._state.pins.values();
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
    return this._state.pins.get(id);
  }

  // TODO: implement pin validation: it should not be selected
  select(pin: PinModel): PinModel {
    this._state.selected = pin;
    return pin;
  }

  isSelected(pin: PinModel) {
    return this._state.selected && pin && this._state.selected.pinId === pin.pinId;
  }

  resolve(pinId: number) {
    return this._state.pins[pinId];
  }

  reserveId(): number {
    return this._state.count++;
  }

  createPin(pin: PinModel) {
    this._state.pins.set(pin.pinId, pin);
    return pin;
  }

  deselect() {
    this._state.selected = null;
  }

  selected() {
    return this._state.selected;
  }

  somePinSelected() {
    return !!this._state.selected;
  }
}
