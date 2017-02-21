// migrate|m <input> <output>                Migrate old xodball into new version

import { readJSON, writeJSON } from 'xod-fs';
import { toV2 } from 'xod-project';
import * as msg from './messages';

const catchLeft = (v2) => {
  if (v2.isLeft) {
    throw v2.value;
  }

  return v2;
};

const outputToFile = (output, xodball) => {
  if (output) {
    return writeJSON(output, xodball)
      .then(() => {
        msg.success(`Successfully migrated and saved to ${output}`);
        process.exit(0);
      })
      .catch((err) => {
        msg.error(err);
        process.exit(1);
      });
  }

  return xodball;
};

export default (input, output) => {
  msg.notice(`Migrating ${input} into ${output} ...`);

  readJSON(input)
    .then(toV2)
    .then(catchLeft)
    .then(v2 => outputToFile(output, v2))
    .catch((err) => {
      msg.error(err);
      process.exit(1);
    });
};
