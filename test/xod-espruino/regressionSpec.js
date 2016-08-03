
import { expect } from 'chai';
import transpile from 'xod-espruino/transpiler';
import exampleState from 'state';

describe('xod-espruino', () => {
  it('should transpile example initial state to kinda valid code', () => {
    const code = transpile(exampleState);
    expect(code).to.match(/var project = {.*};/);
  });
});
