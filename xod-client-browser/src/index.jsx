/* eslint-env browser */

import React from 'react';
import ReactDOM from 'react-dom';
import Root from 'xod-client/core/containers/Root';
import App from './containers/App';

import './styles/main';

ReactDOM.render(<Root><App /></Root>, document.getElementById('root'));
