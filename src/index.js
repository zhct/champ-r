import './index.scss';

import React, { Fragment } from 'react';
import { render } from 'react-dom';
import { AppContainer as ReactHotAppContainer } from 'react-hot-loader';

import App from './app';

const config = require('./native/config');

if (!config.get(`language`)) {
  const language = navigator.language.replace(`-`, `_`);
  config.set(`language`, language);
}

const AppContainer = process.env.PLAIN_HMR ? Fragment : ReactHotAppContainer;

render(
  <AppContainer>
    <App />
  </AppContainer>,
  document.getElementById('app')
);
