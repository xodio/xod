class GenericRoute {
  constructor(uri, resource) {
    this._uri = uri;
    this._resource = resource;
  }

  uri() {
    return this._uri;
  }

  resource() {
    return this._resource;
  }
}

module.exports = GenericRoute;
