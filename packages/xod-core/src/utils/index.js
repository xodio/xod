import { v4 } from 'uuid';

export * from './gmath';
export * from './ramda';
export * from './extract';

export const generateId = () => v4();
