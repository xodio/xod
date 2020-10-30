import waitForElement from 'wait-for-element';
import { FOCUS_BOUND_VALUE, FOCUS_LABEL } from '../editor/actionTypes';

const CONTROL_SELECTORS = {
  // Select widget control with a tricky selector instead of ID, because
  // some constant nodes has a generated id of the terminal Node
  [FOCUS_BOUND_VALUE]: '.PinWidget input, .PinWidget select',
  [FOCUS_LABEL]: '#widget_label',
};

export default _ => next => action => {
  if (Object.prototype.hasOwnProperty.call(CONTROL_SELECTORS, action.type)) {
    // First of all, do the stuff in reducers to show inspector pane.
    const n = next(action);
    // Wait for updated Inspector, because it could appeared
    // or it changed entirely on new selection
    waitForElement('.Inspector-container')
      .then(__ => {
        const ctrl = document.querySelector(CONTROL_SELECTORS[action.type]);
        if (!ctrl) return;
        if (ctrl.setSelectionRange)
          ctrl.setSelectionRange(0, ctrl.value.length);
        ctrl.focus();
      })
      .catch(err => {
        throw err;
      });

    return n;
  }

  return next(action);
};
