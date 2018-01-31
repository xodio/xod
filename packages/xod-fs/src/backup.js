import * as R from 'ramda';
import fs from 'fs-extra';
import path from 'path';
import copy from 'recursive-copy';

const lastDir = dir => dir.split(path.sep).filter(name => name !== '').pop();

// CopyResult :: {
//   src   :: Path,
//   dest  :: Path,
//   stats :: Stats,
// }
// :: Path -> Path -> Promise [CopyResult] Error
const copyContents = (from, to) =>
  fs.readdir(from)
    .then(R.converge(
      R.zip,
      [
        R.map(
          dirOrFileName => path.resolve(
            from, dirOrFileName
          )
        ),
        R.map(
          dirOrFileName => path.resolve(
            to, path.basename(dirOrFileName)
          )
        ),
      ]
    ))
    .then(pairs => Promise.all(
      pairs.map(
        ([fromPath, toPath]) => copy(fromPath, toPath, { overwrite: true })
      )
    ));

export class Backup {
  constructor(dataPath, tempPath) {
    this.path = {
      data: dataPath,
      temp: tempPath,
      dataTemp: path.resolve(tempPath, lastDir(dataPath)),
    };
    this.stored = false;

    this.isDataExist = fs.existsSync(this.path.data);
    this.isTempExist = fs.existsSync(this.path.temp);
    this.isDataTempExist = fs.existsSync(this.path.dataTemp);

    this.make = this.make.bind(this);
    this.clear = this.clear.bind(this);
    this.restore = this.restore.bind(this);
  }

  make() {
    if (!this.isDataExist) {
      return Promise.reject(
        new Error('Can not make a backup: Data is not exist')
      );
    }

    if (!this.isTempExist) { fs.mkdirSync(this.path.temp); }
    if (this.isDataTempExist) { fs.removeSync(this.path.dataTemp); }
    fs.mkdirSync(this.path.dataTemp);

    return copyContents(this.path.data, this.path.dataTemp)
      .then(R.tap(() => { this.stored = true; }));
  }

  clear() {
    if (!this.stored) { return; }

    fs.removeSync(this.path.dataTemp);
    const tempContents = fs.readdirSync(this.path.temp);
    if (tempContents.length === 0) {
      fs.removeSync(this.path.temp);
    }
    this.stored = false;
  }

  restore() {
    if (!this.stored) { return Promise.resolve(); }

    return fs.emptyDir(this.path.data)
      .then(() => copyContents(this.path.dataTemp, this.path.data))
      .then(() => this.clear())
      .then(R.tap(() => { this.stored = false; }));
  }
}

export default Backup;
