
import { upload } from '../runtime/xod-espruino/upload';
import transpile from '../runtime/xod-espruino/transpiler';
import runtime from '!raw!../runtime/xod-espruino/runtime';

export function uploadToEspruino(project, progress) {
  const code = transpile({ project, runtime });
  return upload(code, progress);
}
