const hasDevToolExtension = (typeof window === 'object' && typeof window.devToolsExtension !== 'undefined');
const DEVTOOLS_ENABLED = process.env.NODE_ENV !== 'production';

const devtoolsMiddleware =
  (DEVTOOLS_ENABLED && hasDevToolExtension)
    ? window.devToolsExtension()
    : x => x;

export default devtoolsMiddleware;
