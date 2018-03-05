import { SHOW_GLOBAL_TOOLTIP, HIDE_GLOBAL_TOOLTIP } from './events';

// Emitter functions
export const emitShowTooltip = payload => {
  window.dispatchEvent(
    new window.CustomEvent(SHOW_GLOBAL_TOOLTIP, { detail: payload })
  );
};

export const emitHideTooltip = () => {
  window.dispatchEvent(new window.CustomEvent(HIDE_GLOBAL_TOOLTIP));
};
