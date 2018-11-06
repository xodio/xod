import 'source-map-support/register';

import * as command from '@oclif/command';
import { handle } from '@oclif/errors';

const run = command
  .run()
  .then(command.flush)
  .catch(handle);

export default run;
