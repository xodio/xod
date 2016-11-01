import { generate } from 'shortid';

export * from './gmath';
export * from './ramda';

export const generateId = () => generate();
