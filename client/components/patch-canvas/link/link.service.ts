import { Injectable } from '@angular/core';
import {LinkModel} from './link.model.ts';

@Injectable()
export class LinkService {
  private _links = new Map<number, LinkModel>();
  private count = 0;
  private selected: number = null;

  constructor() {
  }

  create(link: LinkModel) {
    this._links[this.count++] = link;
    link.id = this.count - 1;
    return link;
  }

  link(id: number) {
    return this._links[id];
  }

  links() {
    return Object.keys(this._links).map(key => this._links[key]);
  }

  select(linkId: number) {
    this.selected = linkId;
  }

  isSelected(linkId: number) {
    return this.selected || linkId && this.selected === linkId;
  }
}
