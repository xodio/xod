
import { renderNodes } from './node';
import { renderLinks } from './link';

export function renderPatch(patch) {
  renderLinks(patch);
  renderNodes(patch);
}
