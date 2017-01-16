import { generate } from 'shortid';

export * from './gmath';
export * from './ramda';

const removeTrailingSlash = text => text.replace(/\/$/, '');

export const localID = sid => `@/${removeTrailingSlash(sid)}`;

export const generateId = () => generate();
export const generatePatchSID = () => localID(generateId());

export const isLocalID = id => (typeof id === 'string' && id[0] === '@');
