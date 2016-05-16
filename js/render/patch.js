
import { renderNodes } from './node';
import { renderLinks } from './link';

export function renderPatch(patch) {
  renderNodes(patch);
  renderLinks(patch);
}
