/* eslint-env browser */

import React from 'react';
import ReactDOM from 'react-dom';
import App from './containers/App';
import { initialState } from './state';

ReactDOM.render(<App data={initialState} />, document.getElementById('root'));
