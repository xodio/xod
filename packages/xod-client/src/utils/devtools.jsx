import React from 'react';
import DevTools from '../core/containers/DevTools';

const hasDevToolExtension = (typeof window === 'object' && typeof window.devToolsExtension !== 'undefined');

const DEVTOOLS_ENABLED = process.env.NODE_ENV !== 'production';

const getDevtoolsMiddleware = () => (
  hasDevToolExtension
    ? window.devToolsExtension()
    : DevTools.instrument()
);

export const devToolMiddleware = DEVTOOLS_ENABLED ? getDevtoolsMiddleware() : x => x;

export const devTool = (hasDevToolExtension || !DEVTOOLS_ENABLED) ? null : <DevTools />;

export default devTool;
