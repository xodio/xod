import React from 'react';
import { assert } from 'chai';
import { initialState } from '../app/state.js';

describe('Initial state', function() {
  describe('node types', function () {
    it('cound must be > 0', () => {
      "use strict";
      assert(Object.keys(initialState.nodeTypes).length > 0);
    });
  });
});
