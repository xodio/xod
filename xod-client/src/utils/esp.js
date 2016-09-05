import { upload, transpile, runtime } from 'xod-espruino';

export function uploadToEspruino(project, progress) {
  const code = transpile({ project, runtime });
  return upload(code, progress);
}
