import path from 'path';
import os from 'os';
import fs from 'fs-extra';

export const createWorkingDirectory = prefix =>
  fs.mkdtempSync(path.resolve(os.tmpdir(), `xod-cli-test-${prefix}-`));

export const bundledWorkspacePath = path.resolve(
  __dirname,
  '..',
  'bundle',
  'workspace'
);
