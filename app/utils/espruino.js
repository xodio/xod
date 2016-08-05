
import { upload } from 'xod-espruino/upload';
import runtime from 'raw!xod-espruino/runtime';

export function uploadToEspruino(project, progress) {
  upload({ project, runtime });
}
