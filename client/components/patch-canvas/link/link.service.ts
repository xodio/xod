import { Injectable, Inject, forwardRef } from '@angular/core';
import {LinkModel} from './link.model.ts';
import {EditorBus, EditorMessage} from '../../editor/editor.bus.ts';

interface ILinkServiceState {
  links: Map<number, LinkModel>,
  selected: LinkModel,
  count: number
}

@Injectable()
export class LinkService {
  private _state: ILinkServiceState;

  constructor() {
    this._state = {
      links: new Map<number, LinkModel>(),
      selected: null,
      count: 0
    };
  }

  create(link: LinkModel) {
    this._state.links.set(link.id, link);
    return link;
  }

  link(id: number) {
    return this._state.links.get(id);
  }

  links() {
    const links: Array<LinkModel> = [];
    const iterator = this._state.links.values();
    let value = iterator.next();
    while(!value.done) {
      links.push(value.value);
      value = iterator.next();
    }
    return links;
  }

  select(link: LinkModel): LinkModel {
    this._state.selected = link;
    return link;
  }

  isSelected(linkId: number): boolean {
    if (!!this._state.selected) {
      return linkId && this._state.selected.id === linkId;
    } else {
      return false;
    }
  }

  reserveId(): number {
    return this._state.count++;
  }

  linksOfPatch(patchId: number) {
    return this.links().filter(link => link.patchId === patchId);
  }

  linksIds(patchId: number) {
    return this.linksOfPatch(patchId).map(link => link.id);
  }
}
