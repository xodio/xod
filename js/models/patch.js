
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

    this._links = new Set(obj.links.map(
      linkObj => new Link(linkObj, this)));

    this._features = new Map();
  }

  static nodeTypes(obj) {
    return obj.nodes.map(x => x.type);
  }

  data() {
    return this._obj;
  }

  nodes() {
    return Array.from(this._nodes.values());
  }

  node(id) {
    return this._nodes.get(id);
  }

  links() {
    return Array.from(this._links);
  }

  pins() {
    return Array.prototype.concat([], ...this.nodes().map(x => x.pins()));
  }

  addLink(opts) {
    let id = Math.max(...this.links().map(x => x.id())) + 1;
    if (id < 1) {
      id = 1;
    }

    var linkObj = {
      id: id,
      fromNode: opts.fromNode.id(),
      fromOutput: opts.fromOutput.name(),
      toNode: opts.toNode.id(),
      toInput: opts.toInput.name(),
    };

    this._obj.links.push(linkObj);
    this._links.add(new Link(linkObj, this));
  }

  linksOf(node) {
    return this.links().filter(l => {
      return l.fromNode() === node ||
        l.toNode() === node;
    });
  }

  remove(entity) {
    if (entity.forEach) {
      entity.forEach(e => this._removeOne(e));
    } else {
      this._removeOne(entity);
    }
  }

  _removeOne(entity) {
    // TODO: remove from features
    if (entity instanceof Node) {
      this.remove(entity.links());
      // remove from raw obj
      this._obj.nodes = this._obj.nodes.filter(
        x => x.id !== entity.id());
      // remove from models
      this._nodes.delete(entity.id());
    } else if (entity instanceof Link) {
      // remove from raw obj
      this._obj.links = this._obj.links.filter(
        x => x.id !== entity.id());
      // remove from models
      this._links.delete(entity);
    } else {
      throw new Error("Only links and nodes can be removed");
    }
  }

  feature(entity, name, value) {
    if (entity.forEach) {
      entity.forEach(e => this.feature(e, name, value));
      return;
    }

    if (value === undefined) {
      value = true;
    }

    if (!this._features.has(name)) {
      this._features.set(name, new Set());
    }

    var set = this._features.get(name);
    if (value) {
      set.add(entity);
    } else {
      set.delete(entity);
    }
  }

  isFeatured(entity, name) {
    return this._features.has(name) &&
      this._features.get(name).has(entity);
  }

  featured(name) {
    return this._features.get(name) || new Set();
  }

  emptyFeature(name) {
    this._features.delete(name);
  }
}
