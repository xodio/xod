export default function getBoundingClientRect(page, elementHandle) {
  return page.evaluate(el => {
    // otherwise we'll get an empty object
    const {
      bottom,
      height,
      left,
      right,
      top,
      width,
      x,
      y,
    } = el.getBoundingClientRect();
    return { bottom, height, left, right, top, width, x, y };
  }, elementHandle);
}
