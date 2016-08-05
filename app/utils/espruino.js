
import { upload } from 'xod-espruino/upload';
import transpile from 'xod-espruino/transpiler';
import runtime from 'raw!xod-espruino/runtime';

export function uploadToEspruino(project, progress) {
  const code = transpile({ project, runtime });
  upload(code, progress);
}
