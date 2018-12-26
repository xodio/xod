import waitForElement from 'wait-for-element';
import { SELECT_CONSTANT_NODE_VALUE } from '../editor/actionTypes';

export default _ => next => action => {
  if (action.type === SELECT_CONSTANT_NODE_VALUE) {
    // First of all, do the stuff in reducers to show inspector pane.
    const n = next(action);
    // Wait for updated Inspector, because it could appeared
    // or it changed entirely on new selection
    waitForElement('.Inspector-container')
      .then(__ => {
        // Select widget control with a tricky selector instead of ID, because
        // some constant nodes has a generated id of the terminal Node
        const ctrl = document.querySelector(
          '.PinWidget input, .PinWidget select'
        );
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
