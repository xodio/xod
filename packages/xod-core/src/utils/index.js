import { generate } from 'shortid';

export * from './gmath';
export * from './ramda';

export const localID = (sid) => `@/${sid}`;

export const generateId = () => generate();
export const generatePatchSID = () => localID(generateId());

export const isLocalID = (id) => (id[0] === '@');
