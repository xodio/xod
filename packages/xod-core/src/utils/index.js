import { v4 } from 'uuid';

export * from './gmath';
export * from './ramda';
export * from './unpack';

export const generateId = () => v4();
