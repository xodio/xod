export const WORKSPACE_FILENAME = '.xodworkspace';
export const DEFAULT_WORKSPACE_PATH = '~/xod/';
export const DEFAULT_PROJECT_NAME = 'welcome-to-xod';
export const LIBS_FOLDERNAME = 'lib';

export const IMPL_FILENAMES = {
  cpp: 'any.cpp',
  js: 'any.js',
  arduino: 'arduino.cpp',
  espruino: 'espruino.js',
  nodejs: 'nodejs.js',
};
export const IMPL_TYPES = Object.keys(IMPL_FILENAMES);

export const BASE64_EXTNAMES = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.fzz',
];
export const UTF8_EXTNAMES = [
  '.md',
];
export const ATTACHMENT_EXTNAMES = BASE64_EXTNAMES.concat(UTF8_EXTNAMES);
