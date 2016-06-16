import {Injectable} from '@angular/core';
import {PinModel, PinType} from './pin.model.ts';
import {IServiceState} from '../../../../share/interfaces.ts';

@Injectable()
export class PinService {
  private _state: IServiceState;

  constructor() {
    this._state = {
      models: new Map<number, PinModel>(),
      selected: null,
      count: 0
    };
  }

  pins() {
    const pins: Array<PinModel> = [];
    const iterator = this._state.models.values();
    let value = iterator.next();
    while(!value.done) {
      pins.push(value.value);
      value = iterator.next();
    }
    return pins;
  }

  pinsIds(nodeId: number): Array<number> {
    return this.pins().map(pin => pin.id);
  }

  pinsOfNode(nodeId: number): Array<PinModel> {
    return this.pins().filter(pin => pin.nodeId === nodeId);
  }

  inputPinsIds(nodeId: number): Array<number> {
    return this.pinsOfNode(nodeId).filter(pin => pin.type === PinType.Input).map(pin => pin.id);
  }

  outputPinsIds(nodeId: number): Array<number> {
    return this.pinsOfNode(nodeId).filter(pin => pin.type === PinType.Output).map(pin => pin.id);
  }

  pin(id: number): PinModel {
    return this._state.models.get(id);
  }

  // TODO: implement pin validation: it should not be selected
  select(pin: PinModel): PinModel {
    this._state.selected = pin;
    return pin;
  }

  isSelected(pin: PinModel) {
    return this._state.selected && pin && this._state.selected.id === pin.id;
  }

  resolve(id: number) {
    return this._state.models[id];
  }

  reserveId(): number {
    return this._state.count++;
  }

  createPin(pin: PinModel) {
    this._state.models.set(pin.id, pin);
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
