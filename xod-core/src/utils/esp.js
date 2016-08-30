
import { upload } from 'xod-core/runtime/xod-espruino/upload';
import transpile from 'xod-core/runtime/xod-espruino/transpiler';
import runtime from 'xod-core/runtime/xod-espruino/runtime';

export function uploadToEspruino(project, progress) {
  const code = transpile({ project, runtime });
  return upload(code, progress);
}
