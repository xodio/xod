import chai, { expect } from 'chai';
import path from 'path';
import chaiFiles from 'chai-files';
import chaiFs from 'chai-fs';
import dirtyChai from 'dirty-chai';
import rimraf from 'rimraf';
import doc from '../src/index';

const packed = require('./mocks/pack.json');

chai.use(chaiFiles);
chai.use(chaiFs);
chai.use(dirtyChai);

function pathResolve(ending, rootPath = __dirname) {
  return path.resolve(rootPath, ending);
}

describe('Generate docs', () => {
  const file = chaiFiles.file;
  const dir = chaiFiles.dir;

  const tmpPath = path.join(__dirname, '.tmp');

  before((done) => {
    doc(
      tmpPath,
      pathResolve('layouts'),
      pathResolve('xod/core'),
      true)
    .then(done);
  });
  after(() => {
    rimraf.sync(tmpPath);
  });

  it('shoult create folder tmp', () =>
    expect(
      dir(tmpPath)
    ).to.exist()
  );

  it('shoult create folder nodes', () =>
    expect(
      dir(
        pathResolve('nodes', tmpPath)
        )
      )
    .to.exist()
  );

  it('shoult create index file', () =>
    expect(
      file(
        pathResolve('index.html', tmpPath)
        )
      )
    .to.exist()
  );

  it('should create doc files', () => {
    const files = packed.map(el => (el.link.replace('nodes/', '')));
    expect(pathResolve('nodes', tmpPath)).to.be.a.directory().and.include.files(files);
  });

  it('files should contain not less than 1 match of patch label', () => {
    packed.forEach((el) => {
      const re = new RegExp(`<h1>${el.label}</h1>`);
      expect(file(pathResolve(el.link, tmpPath))).to.match(re);
    });
  });
  it('index should contain all labels', () => {
    packed.forEach((el) => {
      const re = new RegExp(el.label);
      expect(file(pathResolve('index.html', tmpPath))).to.match(re);
    });
  });
});
