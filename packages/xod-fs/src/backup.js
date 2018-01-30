import fs from 'fs-extra';
import path from 'path';
import copy from 'recursive-copy';

const lastDir = dir => dir.split(path.sep).filter(name => name !== '').pop();

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
    return new Promise((resolve, reject) => {
      if (!this.isDataExist) { resolve('data is not exist'); return; }
      if (!this.isTempExist) { fs.mkdirSync(this.path.temp); }
      if (!this.isDataTempExist) { fs.mkdirSync(this.path.dataTemp); }

      copy(this.path.data, this.path.dataTemp, (err) => {
        if (err) { reject(err); return; }
        this.stored = true;
        resolve();
      });
    });
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

    return new Promise((resolve, reject) => {
      fs.removeSync(this.path.data);
      copy(this.path.dataTemp, this.path.data, (err) => {
        if (err) { reject(err); return; }
        this.clear();
        resolve();
      });
    });
  }
}

export default Backup;
