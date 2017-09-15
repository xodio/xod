import R from 'ramda';

export const bindApi = (api, fn) => (...args) => fn(api, ...args);

// :: Point -> String
export const getOffsetMatrix = ({ x, y }) => `matrix(1, 0, 0, 1, ${x}, ${y})`;

// :: Ref -> Point -> Event -> Point
export const getMousePosition = (rootRef, offset, event) => {
  // TODO: warn that we returned default value?
  if (!rootRef) return { x: 0, y: 0 };

  const bbox = rootRef.getBoundingClientRect();

  return {
    x: event.clientX - bbox.left - offset.x,
    y: event.clientY - bbox.top - offset.y,
  };
};

// :: Event -> Boolean
export const isMiddleButtonPressed = R.pathEq(['nativeEvent', 'which'], 2);
