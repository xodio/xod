/* eslint-env browser */

import React from 'react';
import ReactDOM from 'react-dom';
import App from './containers/App';

import upload from '../targets/espruino/upload';

ReactDOM.render(<App onUpload={upload} />, document.getElementById('root'));
