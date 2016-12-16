import chai, { expect } from 'chai';
import path from 'path';
import chaiFiles from 'chai-files';
import chaiFs from 'chai-fs';
import dirtyChai from 'dirty-chai';
import doc from '../src/index';

const packed = require('./mocks/pack.json');

chai.use(chaiFiles);
chai.use(chaiFs);
chai.use(dirtyChai);


describe('Generate docs', () => {
  const file = chaiFiles.file;
  const dir = chaiFiles.dir;

  const tmpPath = path.join(__dirname, 'tmp');

  before((done) => {
    doc(tmpPath, path.resolve(__dirname, 'layouts'), path.resolve(__dirname, 'xod/core'), true).then(() => done());
  });

  it('shoult create folder tmp', () =>
    expect(
      dir(tmpPath)
    ).to.exist()
  );

  it('shoult create folder nodes', () =>
    expect(
      dir(
        path.resolve(tmpPath, 'nodes')
        )
      )
    .to.exist()
  );

  it('shoult create index file', () =>
    expect(
      file(
        path.resolve(tmpPath, 'index.html')
        )
      )
    .to.exist
  );

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
