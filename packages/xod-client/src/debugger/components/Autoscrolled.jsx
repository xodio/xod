import React from 'react';
import autoscroll from 'autoscroll-react';

// because `autoscroll-react` uses refs
// eslint-disable-next-line react/prefer-stateless-function
class Autoscrolled extends React.Component {
  render() {
    return <div className="log" {...this.props} />;
  }
}

export default autoscroll(Autoscrolled, { isScrolledDownThreshold: 0 });
