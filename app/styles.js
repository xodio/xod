const Styles = {
  svg: {
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
          fill: 'lightgrey',
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
    }
  }
};

export default Styles;