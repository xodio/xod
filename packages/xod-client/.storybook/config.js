import { configure } from '@storybook/react';

const req = require.context('../stories', true, /.jsx?$/);

configure(() => {
  req.keys().forEach(req)
}, module);
