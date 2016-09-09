import { upload, transpile, runtime } from 'xod-espruino';

export function doTranspile(project) {
  return transpile({ project, runtime });
}

export function uploadToEspruino(project, progress) {
  const code = doTranspile(project);
  return upload(code, progress);
}

