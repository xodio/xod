import R from 'ramda'

const Stylizer = {
  assignStyles: (component, styles) => {
    if (!component.styles) {
      component.styles = {
        styles: styles,
        keys: {},
        getters: []
      };
    }
    // assign default getter
    component.styles.getters.push( Stylizer.getters.normal.bind(component) );
    // assign default getStyle method
    component.getStyle = Stylizer._funcs.getStyle.bind(component);
  },
  hoverable: (component, keys) => {
    if (!component.styles) {
      Stylizer.assignStyles(component, {});
    }
    if (!component.state) {
      component.state = {};
    }
    component.state.hovered = false;
    component.onMouseOver = Stylizer._funcs.onMouseOver;
    component.onMouseOut = Stylizer._funcs.onMouseOut;
    component.handleOver = component.onMouseOver.bind(component);
    component.handleOut = component.onMouseOut.bind(component);

    component.styles.keys.hover = keys;
    component.styles.getters.push( Stylizer.getters.hover.bind(component) );
  },
  getters: {
    normal: function (styles) {
      for (let k in styles) {
        styles[k] = (styles[k].hasOwnProperty('normal')) ? styles[k].normal : styles[k];
      }
      return styles;
    },
    hover: function (styles) {
      if (this.state && this.state.hovered) {
        for (let i in this.styles.keys.hover) {
          let kind = this.styles.keys.hover[i];

          if (this.styles.styles[kind].hasOwnProperty('hover')) {
            styles[kind] = R.merge(styles[kind], this.styles.styles[kind].hover);
          }
        }
      }

      return styles;
    }
  },

  _funcs: {
    getStyle: function () {
      let styles = Object.assign({}, this.styles.styles);
      for (let g in this.styles.getters) {
        styles = this.styles.getters[g](styles);
      }
      return styles;
    },
    onMouseOver: function () {
      let state = Object.assign({}, this.state);
      state.hovered = true;
      this.setState(state);
    },
    onMouseOut: function () {
      let state = Object.assign({}, this.state);
      state.hovered = false;
      this.setState(state);
    }
  },
};

export default Stylizer;