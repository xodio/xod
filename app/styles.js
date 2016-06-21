const Styles = {
  svg: {
    background: {
      fill: '#eee'
    },
    node: {
      // sizes
      width: 100,
      height: 60,
      padding: {
        x: 2,
        y: 25
      },
      // styles
      block: {
        fill: 'transparent'
      },
      rect: {
        normal: {
          fill: '#ccc',
          stroke: 'black',
          strokeWidth: 1,
        },
        hover: {
          fill: 'lightblue'
        }
      },
      text: {
        normal: {
          textAnchor: 'middle',
          aligmentBaseline: 'central',
          fill: 'black',
          fontSize: 12
        },
        hover: {
          fill: 'blue'
        }
      }
    },
    pin: {
      radius: 5,
      margin: 15,
      block: {
        width: 15,
        height: 25,
        fill: 'transparent'
      },
      circle: {
        normal: {
          fill: 'darkgrey',
          stroke: 'black',
          strokeWidth: 1,
          cursor: 'default',
        },
        hover: {
          fill: 'red'
        }
      },
      text: {
        normal: {
          fill: 'black',
          fontSize: 12,
          aligmentBaseline: 'central',
          cursor: 'default',
        },
        hover: {
          fill: 'red'
        }
      }
    },
    link: {
      line: {
        normal: {
          stroke: 'black',
          strokeWidth: 2
        },
        hover: {
          stroke: 'red'
        }
      },
      helper: {
        normal: {
          stroke: 'transparent',
          strokeWidth: 8
        },
        hover: {
          stroke: 'yellow'
        }
      }
    }
  }
};

export default Styles;