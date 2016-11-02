import React from 'react';
import DevTools from '../core/containers/DevTools';

const hasDevToolExtension = (typeof window === 'object' && typeof window.devToolsExtension !== 'undefined');

export const devToolMiddleware = hasDevToolExtension ?
  window.devToolsExtension() : DevTools.instrument();

export const devTool = (hasDevToolExtension ? null : <DevTools />);

export default devTool;
