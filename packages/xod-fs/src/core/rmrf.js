import { remove } from 'fs-extra';

export default path => new Promise(
  (resolve, reject) => remove(path, (err) => {
    if (err) { reject(err); return; }
    resolve();
  })
);
