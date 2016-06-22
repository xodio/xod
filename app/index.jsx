/* eslint-env browser */

import React from 'react';
import ReactDOM from 'react-dom';
import App from './containers/App';
import initialState from './shared/initial-state'

ReactDOM.render(<App {...initialState} />, document.getElementById('root'));
