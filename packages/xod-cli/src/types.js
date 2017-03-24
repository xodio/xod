export default class LibrarySymbol {
  static parse(string) {
    const match = string.match(/^(.+?)\/(.+?)(?:\/(.+?))?$/);
    if (!match) {
      throw new Error(
        `could not parse library symbol "${string}" ("<owner>/<slug>[/<semver>]").`
      );
    }
    const [, owner, slug, semver] = match;
    return new LibrarySymbol(owner, slug, semver);
  }

  static parsePromise(string) {
    return new Promise(resolve => resolve(LibrarySymbol.parse(string)));
  }

  constructor(owner, slug, semver) {
    this.owner = owner;
    this.slug = slug;
    this.semver = semver;
  }

  toString() {
    return `${this.owner}/${this.slug}${this.semver ? `/${this.semver}` : ''}`;
  }
}
