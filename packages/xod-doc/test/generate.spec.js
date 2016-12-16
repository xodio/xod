import chai from 'chai';
import path from 'path';
import chaiFiles from 'chai-files';
import chaiFs from 'chai-fs';

import doc from '../src/xod-doc';

const packed = require('./mocks/pack.json');

describe('Generate docs', () => {
  chai.use(chaiFiles);
  chai.use(chaiFs);
  const expect = chai.expect;
  const file = chaiFiles.file;
  const dir = chaiFiles.dir;

  const tmpPath = path.join(__dirname, 'tmp');

  before((done) => {
    doc(tmpPath, path.resolve(__dirname, 'layouts'), path.resolve(__dirname, 'xod/core'), { clear: true }).then(() => done());
  });

  it('shoult create folder tmp', () => expect(dir(tmpPath)).to.exist);

  it('shoult create folder nodes', () => expect(dir(path.resolve(tmpPath, 'nodes'))).to.exist);

  it('shoult create index file', () => expect(file(path.resolve(tmpPath, 'index.html'))).to.exist);

  it('should create doc files', () => {
    const files = packed.map(el => (el.link.replace('nodes/', '')));
    expect(path.resolve(tmpPath, 'nodes')).to.be.a.directory().and.include.files(files);
  });

  it('files should contain not less than 1 match of patch label', () => {
    packed.forEach(el => {
      const re = new RegExp(`<h1>${el.label}</h1>`);
      expect(file(path.resolve(tmpPath, el.link))).to.match(re);
    });
  });
  it('index should contain all labels', () => {
    packed.forEach(el => {
      const re = new RegExp(el.label);
      expect(file(path.resolve(tmpPath, 'index.html'))).to.match(re);
    });
  });
});
