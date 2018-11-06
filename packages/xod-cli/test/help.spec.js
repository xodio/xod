import { test } from '@oclif/test';
import { assert } from 'chai';

describe('xodc help', () => {
  const stdMock = test.stdout().stderr();

  stdMock.command(['help']).it('prints help to stdout', ctx => {
    assert.include(
      ctx.stdout,
      'autocomplete',
      'autocomplete command not found'
    );
    assert.include(ctx.stdout, 'help', 'help command not found');
    assert.include(ctx.stdout, 'publish', 'publish command not found');
    assert.include(ctx.stdout, 'resave', 'resave command not found');
    assert.include(ctx.stdout, 'tabtest', 'tabtest command not found');
    assert.include(ctx.stdout, 'transpile', 'transpile command not found');
  });

  ['autocomplete', 'help', 'publish', 'resave', 'tabtest', 'transpile'].forEach(
    command => {
      stdMock
        .command(['help', command])
        .it(`prints help to stdout for command '${command}'`, ctx => {
          assert.include(
            ctx.stdout,
            command,
            `help for command '${command}' not found`
          );
        });
    }
  );
});
