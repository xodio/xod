import { v4 } from 'uuid';

export * from './gmath';
export * from './ramda';

export const generateId = () => v4();
