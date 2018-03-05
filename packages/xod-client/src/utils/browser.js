import * as R from 'ramda';

export function getViewableSize(defaultWidth = 0, defaultHeight = 0) {
  const sizes = {
    width: defaultWidth,
    height: defaultHeight,
  };

  if (window || document) {
    sizes.width =
      document.body.clientWidth ||
      document.documentElement.clientWidth ||
      window.innerWidth ||
      0;
    sizes.height =
      document.body.clientHeight ||
      document.documentElement.clientHeight ||
      window.innerHeight ||
      0;
  }

  return sizes;
}

export const findParentByClassName = (element, className) => {
  let result = null;
  if (element && element.classList && element.classList.contains(className)) {
    result = element;
  } else if (element.parentNode) {
    result = findParentByClassName(element.parentNode, className);
  }
  return result;
};

export const checkForMouseBubbling = (event, parent) => {
  const elem = event.toElement || event.relatedTarget;
  return elem.parentNode === parent || elem === parent;
};

export const isInput = R.compose(
  R.flip(R.contains)(['INPUT', 'TEXTAREA', 'SELECT']),
  R.prop('nodeName')
);

export const isInputTarget = event => isInput(event.target || event.srcElement);

export const isEdge = () =>
  R.compose(R.test(/Edge/), R.pathOr('', ['navigator', 'userAgent']))(window);
