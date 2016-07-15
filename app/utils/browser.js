export function getViewableSize(defaultWidth = 0, defaultHeight = 0) {
  const sizes = {
    width: defaultWidth,
    height: defaultHeight,
  };

  if (window || document) {
    sizes.width = (
      document.body.clientWidth || document.documentElement.clientWidth || window.innerWidth || 0
    );
    sizes.height = (
      document.body.clientHeight || document.documentElement.clientHeight || window.innerHeight || 0
    );
  }

  return sizes;
}

export function getStyle(oElm, strCssRule) {
  let strValue = '';
  let strCss = strCssRule;
  if (document.defaultView && document.defaultView.getComputedStyle) {
    strValue = document.defaultView.getComputedStyle(oElm, '').getPropertyValue(strCssRule);
  } else if (oElm.currentStyle) {
    strCss = strCssRule.replace(/\-(\w)/g, (strMatch, p1) => p1.toUpperCase());
    strValue = oElm.currentStyle[strCss];
  }
  return strValue;
}
