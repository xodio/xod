import path from 'path';

export const resolveBundledWorkspacePath = () =>
  path.resolve(__dirname, '..', 'bundle', 'workspace');

export const resolveBundledTabtestWorkspacePath = () =>
  path.resolve(__dirname, '..', 'bundle', 'tabtest-workspace');

export const resolveBundledTabtestSrcPath = () =>
  path.resolve(__dirname, '..', 'bundle', 'tabtest-cpp');

export const resolveBundledCatch2Path = () =>
  path.resolve(__dirname, '..', 'bundle', 'catch2');

export const resolveBundledCatch2UtilsPath = () =>
  path.resolve(__dirname, '..', 'bundle', 'catch2utils');
