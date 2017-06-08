export default class LibUri {
  constructor(orgname, libname, tag = 'latest') {
    if (!libname) throw new Error('`libname` can\'t be empty.');
    if (!orgname) throw new Error('`orgname` can\'t be empty.');
    this.libname = libname;
    this.orgname = orgname;
    this.tag = tag;
  }

  get withoutTag() {
    return `${this.orgname}/${this.libname}`;
  }

  static parse(string) {
    return new Promise((resolve, reject) => {
      const match = string.match(/^([^@/]+?)\/([^@/]+?)(?:@([^@/]+?))?$/);
      if (match) {
        const [, orgname, libname, tag] = match;
        return resolve(new LibUri(orgname, libname, tag));
      }
      return reject(new Error(
        `could not parse "${string}" to <orgname>/<libname>[@<tag>].`
      ));
    });
  }

  toString() {
    return `${this.withoutTag}@${this.tag}`;
  }
}
