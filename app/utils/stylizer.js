import R from 'ramda';

const Stylizer = {
  assignStyles: (component, styles) => {
    const c = component;

    if (!c.styles) {
      c.styles = {
        styles,
        keys: {},
        getters: [],
      };
    }
    // assign default getter
    c.styles.getters.push(Stylizer.getters.normal.bind(c));
    // assign default getStyle method
    c.getStyle = Stylizer.funcs.getStyle.bind(c);
  },
  hoverable: (component, keys) => {
    const c = component;

    if (!c.styles) {
      Stylizer.assignStyles(c, {});
    }
    if (!c.state) {
      c.state = {};
    }
    c.state.hovered = false;
    c.onMouseOver = Stylizer.funcs.onMouseOver;
    c.onMouseOut = Stylizer.funcs.onMouseOut;
    c.handleOver = c.onMouseOver.bind(c);
    c.handleOut = c.onMouseOut.bind(c);

    c.styles.keys.hover = keys;
    c.styles.getters.push(Stylizer.getters.hover.bind(c));
  },
  getters: {
    normal(styles) {
      return Object.keys(styles).reduce(
        (prev, cur) => {
          const p = prev;
          p[cur] = ((styles[cur].hasOwnProperty('normal')) ? styles[cur].normal : styles[cur]);
          return p;
        }, {}
      );
    },
    hover(styles) {
      let hovered = {};

      if (this.state && this.state.hovered) {
        hovered = this.styles.keys.hover.reduce(
          (prev, cur) => {
            const p = prev;
            if (this.styles.styles[cur].hasOwnProperty('hover')) {
              p[cur] = this.styles.styles[cur].hover;
            }
            return p;
          }, {}
        );
      }

      return R.mergeWith(R.merge, styles, hovered);
    },
  },

  funcs: {
    getStyle() {
      let styles = Object.assign({}, this.styles.styles);
      this.styles.getters.forEach((func) => {
        styles = func(styles);
      });
      return styles;
    },
    onMouseOver() {
      const state = Object.assign({}, this.state);
      state.hovered = true;
      this.setState(state);
    },
    onMouseOut() {
      const state = Object.assign({}, this.state);
      state.hovered = false;
      this.setState(state);
    },
  },
};

export default Stylizer;
