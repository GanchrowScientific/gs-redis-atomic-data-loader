/* Copyright © 2018 Ganchrow Scientific, SA all rights reserved */
'use strict';

import 'jasmine';

import {LUA_COMMANDS} from '../src/luaCommands';

describe('CommandNames', () => {
  it('should return expected lua commands', () => {
    expect(Object.keys(LUA_COMMANDS)).toEqual([
      'isJson',
      'zipHash',
      'commandTable',
      'generate',
      'main'
    ]);
  });
});
