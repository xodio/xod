
export default class Model {
  element(e) {
    if (e === undefined) {
      return this._element;
    } else {
      this._element = e;
      return this;
    }
  }
}
