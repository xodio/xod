import R from 'ramda';

const makeStyleReducer = (key, isStore = false) => function styleReducer(styles) {
  let result = {};
  const storeKey = (isStore) ? 'props' : 'state';
  if (this[storeKey] && this[storeKey][key]) {
    const val = this[storeKey][key];
    result = this.styles.keys[key].reduce(
      (prev, cur) => {
        let p = prev;
        const hasStyles = this.styles.styles[cur].hasOwnProperty(key);
        if (hasStyles) {
          const hasPropStyle = (
            typeof this.styles.styles[cur][key] === 'object' &&
            this.styles.styles[cur][key].hasOwnProperty(val)
          );
          let updateWith;
          if (hasPropStyle) {
            updateWith = this.styles.styles[cur][key][val];
          } else {
            updateWith = this.styles.styles[cur][key];
          }

          p = R.assoc(cur, updateWith, prev);
        }
        return p;
      }, {}
    );
  }
  return R.mergeWith(R.merge, styles, result);
};

const Stylizer = {
  init: (component) => {
    const c = component;
    if (!c.styles) {
      Stylizer.assignStyles(c, {});
    }
    if (!c.state) {
      c.state = {};
    }
  },
  assignStyles: (component, styles) => {
    const c = component;

    if (!c.styles) {
      c.styles = {
        styles,
        keys: {},
        getters: [],
      };
    }
    // assign default getters
    c.styles.getters.push(Stylizer.getters.normal.bind(c));
    // assign default getStyle method
    c.getStyle = Stylizer.funcs.getStyle.bind(c);
  },
  hoverable: (component, keys) => {
    const c = component;
    Stylizer.init(c);
    c.state.hover = false;

    c.onMouseOver = Stylizer.funcs.onMouseOver;
    c.onMouseOut = Stylizer.funcs.onMouseOut;
    c.handleOver = c.onMouseOver.bind(c);
    c.handleOut = c.onMouseOut.bind(c);

    c.styles.keys.hover = keys;
    c.styles.getters.push(Stylizer.getters.hover.bind(c));
  },
  selectable: (component, keys) => {
    const c = component;
    Stylizer.init(c);
    c.state.selected = false;

    c.styles.keys.selected = keys;
    c.styles.getters.push(Stylizer.getters.selected.bind(c));
  },
  dependOnProp: (component, propName, keys) => {
    const c = component;
    Stylizer.init(c);

    c.styles.keys[propName] = keys;
    c.styles.getters.push(Stylizer.getters.dependOnProp(c, propName));
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
    hover: makeStyleReducer('hover'),
    selected: makeStyleReducer('selected', true),
    dependOnProp: (component, propName) => makeStyleReducer(propName, true).bind(component),
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
      state.hover = true;
      this.setState(state);
    },
    onMouseOut() {
      const state = Object.assign({}, this.state);
      state.hover = false;
      this.setState(state);
    },
  },
};

export default Stylizer;
