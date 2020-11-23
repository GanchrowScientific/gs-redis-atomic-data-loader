/* Copyright © 2018-2020 Ganchrow Scientific, SA all rights reserved */
'use strict';

import 'jasmine';

import { LUA_COMMANDS } from '../src/luaCommands';

describe('CommandNames', () => {
  it('should return expected lua commands', () => {
    expect(Object.keys(LUA_COMMANDS)).toEqual([
      'chunk',
      'isJson',
      'zipHash',
      'commandTable',
      'generate',
      'main'
    ]);
  });
});
