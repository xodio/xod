/* eslint-disable no-console */

import clc from 'cli-color';

export const hello = () => {
  const xodTitle = '~≈ XOD-CLI ≈~';
  const style = clc.xterm(17).bold;
  console.log(style(xodTitle));
};

export const bold = clc.bold;
export const text = clc.xterm(233);

export const error = msg => console.error(clc.xterm(197)(`✗ ${msg}`));
export const warn = msg => console.warn(clc.xterm(214)('!'), text(msg));
export const notice = msg => console.log(' ', text(msg));
export const success = msg => console.log(clc.xterm(28)(`✓ ${msg}`));

export const description = msg => console.log(clc.xterm(242).italic(msg));
