import { Injectable, Inject, forwardRef } from '@angular/core';
import {LinkModel} from './link.model.ts';
import {EditorBus, EditorMessage} from '../../editor/editor.bus.ts';

@Injectable()
export class LinkService {
  private _links = new Map<number, LinkModel>();
  private count = 0;
  private selected: LinkModel = null;

  constructor() {
  }

  create(link: LinkModel) {
    this._links.set(link.id, link);
    return link;
  }

  link(id: number) {
    return this._links.get(id);
  }

  links() {
    const links: Array<LinkModel> = [];
    const iterator = this._links.values();
    let value = iterator.next();
    while(!value.done) {
      links.push(value.value);
      value = iterator.next();
    }
    return links;
  }

  select(link: LinkModel): LinkModel {
    this.selected = link;
    return link;
  }

  isSelected(linkId: number): boolean {
    if (!!this.selected) {
      return linkId && this.selected.id === linkId;
    } else {
      return false;
    }
  }

  reserveId(): number {
    this.count++;
    return this.count;
  }

  linksOfPatch(patchId: number) {
    return this.links().filter(link => link.patchId === patchId);
  }

  linksIds(patchId: number) {
    return this.linksOfPatch(patchId).map(link => link.id);
  }
}
