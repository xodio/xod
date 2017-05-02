import rimraf from 'rimraf';

export default path => new Promise(
  (resolve, reject) => rimraf(path, (err) => {
    if (err) { reject(err); return; }
    resolve();
  })
);
