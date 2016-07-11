import React from 'react';
import { connect } from 'react-redux';

class SnackBar extends React.Component {
  constructor(props) {
    super(props);
  }
  render() {
    return <div>SnackBar</div>;
  }
}

export default connect(state => state)(SnackBar);
