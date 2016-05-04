
export default class Model {
  constructor(patch) {
    this._patch = patch;
  }

  element(e) {
    if (e === undefined) {
      return this._element;
    } else {
      this._element = e;
      return this;
    }
  }

  patch() {
    return this._patch;
  }

  feature(name, value) {
    this.patch().feature(this, name, value);
  }

  featured(name) {
    return this.patch().featured(this, name);
  }
}
