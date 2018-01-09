/* Copyright © 2018 Ganchrow Scientific, SA all rights reserved */
'use strict';

import * as nodeunit from 'nodeunit';
import {LUA_COMMANDS} from '../src/luaCommands';

module.exports = {
  testCommandNames(test: nodeunit.Test) {
    test.deepEqual(Object.keys(LUA_COMMANDS), [
      'isJson',
      'zipHash',
      'commandTable',
      'generate',
      'main'
    ]);
    test.done();
  }
};
