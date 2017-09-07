import R from 'ramda';

export const retryOrFail = R.curry(
  (delays, stopFn, errFn, retryFn) => {
    const maxRetries = delays.length;
    let retryCounter = 0;


    const run = data => new Promise((resolve, reject) => {
      if (stopFn(data) || retryCounter === maxRetries) {
        reject(errFn(data));
        return;
      }

      setTimeout(() => {
        retryCounter += 1;
        retryFn()
          .catch(run)
          .then(resolve)
          .catch(reject);
      }, delays[retryCounter]);
    });

    return run;
  }
);

export default {};
