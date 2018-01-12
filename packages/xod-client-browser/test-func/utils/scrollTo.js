export default function scrollTo(page, containerHandle, childHandle) {
  return page.evaluate((container, child) => {
    // eslint-disable-next-line no-param-reassign
    container.scrollTop = child.offsetTop;
  }, containerHandle, childHandle);
}
