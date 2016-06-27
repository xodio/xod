export function getViewableSize(defaultWidth = 0, defaultHeight = 0) {
  const sizes = {
    width: defaultWidth,
    height: defaultHeight,
  };

  if (window || document) {
    sizes.width = (
      window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 0
    );
    sizes.height = (
      window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || 0
    );
  }

  return sizes;
}
