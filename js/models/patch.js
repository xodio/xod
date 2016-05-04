
import Model from './model';
import Node from './node';
import Link from './link';

export default class Patch extends Model { 
  constructor(obj, nodeRepository) {
    super();

    this._obj = obj;

    this._nodes = new Map(obj.nodes.map(
      nodeObj => [
        nodeObj.id,
        new Node({
          obj: nodeObj,
          layoutObj: obj.ui.nodes[nodeObj.id],
          typeObj: nodeRepository.get(nodeObj.type),
          patch: this
        })
      ]
    ));

    this._links = obj.links.map(
      linkObj => new Link(linkObj, this));
  }

  static nodeTypes(obj) {
    return obj.nodes.map(x => x.type);
  }

  nodes() {
    return Array.from(this._nodes.values());
  }

  node(id) {
    return this._nodes.get(id);
  }

  links() {
    return this._links;
  }

  addLink(opts) {
    var linkObj = {
      fromNode: opts.fromNode.id(),
      fromOutput: opts.fromOutput.name(),
      toNode: opts.toNode.id(),
      toInput: opts.toInput.name(),
    };

    this._obj.links.push(linkObj);
    this._links.push(new Link(linkObj, this));
  }
}
