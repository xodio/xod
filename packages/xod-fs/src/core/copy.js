import { curry } from 'ramda';
import fse from 'fs-extra';

export default curry(
  (source, target) =>
    new Promise((resolve, reject) => {
      fse.copy(source, target, err => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    })
);
