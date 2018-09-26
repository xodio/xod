import * as R from 'ramda';
import { noop, isAmong } from 'xod-func-tools';

import promisifyIpc from '../view/promisifyIpc';
import { LIST_BOARDS, UPLOAD_TO_ARDUINO } from '../shared/events';

const listBoardsIpc = promisifyIpc(LIST_BOARDS);

const getPackageFromFqbn = R.pipe(R.split(':'), R.take(2), R.join(':'));

export const listBoards = () =>
  listBoardsIpc(noop, null).then(({ available, installed }) => {
    const installedPackages = R.compose(
      R.uniq,
      R.map(getPackageFromFqbn),
      R.pluck('fqbn')
    )(installed);

    return {
      installed,
      available: R.reject(
        R.propSatisfies(isAmong(installedPackages), 'package'),
        available
      ),
    };
  });

export const upload = promisifyIpc(UPLOAD_TO_ARDUINO);
