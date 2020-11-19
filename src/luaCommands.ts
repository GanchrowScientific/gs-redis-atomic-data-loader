/* Copyright © 2020 Ganchrow Scientific, SA all rights reserved */
'use strict';

export const LUA_COMMANDS: any = {};
LUA_COMMANDS.isJson = `
  local function isJson(value)
    return type(value) == 'string' and
      (string.sub(value, 1, 1) == '{' or string.sub(value, 1, 1) == '[')
  end
`;
LUA_COMMANDS.zipHash = `
  local function zipHash(keys, values, withNonJson)
    local result = {}
    for i, key in ipairs(keys) do
      local value = values[i]
      if isJson(value) then
        result[key] = cjson.decode(value)
      elseif withNonJson then
        result[key] = value
      end
    end
    return result
  end
`;

LUA_COMMANDS.commandTable = `
  local commandTable = {
    loadKeys = {
      execute = function(arg, partial)
        partial = partial or {}
        local keys = redis.call('keys', arg)
        if #keys > 0 then
          for _, k in ipairs(keys) do
            if redis.call('TYPE', k).ok == 'string' then
              local v = redis.call('get', k)
              for key, field in pairs(zipHash({k}, {v})) do
                partial[key] = field
              end
            end
          end
        end
        return partial
      end
    },
    loadArray = {
      execute = function(arg, partial)
        partial = partial or {}
        for _, item in ipairs(redis.call('lrange', arg, 0, -1)) do
          if (isJson(item)) then
            item = cjson.decode(item)
          end
          table.insert(partial, tonumber(item) or item)
        end
        return partial
      end
    },
    loadHash = {
      execute = function(arg, partial)
        partial = partial or {}
        local keys = redis.call('hkeys', arg)
        if #keys > 0 then
          for key, field in pairs(zipHash(keys, redis.call('hmget', arg, unpack(keys)), true)) do
            partial[key] = field
          end
        end
        return partial
      end
    }
  }
`;

LUA_COMMANDS.generate = `
  local function generate(configObject)
    local resultObject = {}
    for code, items in pairs(configObject) do
      if type(items) == 'table' then
        local partialResults = resultObject[code]
        for cmd, args in pairs(items) do
          local cmdExec = commandTable[cmd]
          if not cmdExec then
            break
          end
          if not partialResults then
            partialResults = {}
            resultObject[code] = partialResults
          end
          for _, arg in ipairs(args) do
            cmdExec.execute(arg, partialResults)
          end
        end
      end
    end
    return resultObject
  end
`;

LUA_COMMANDS.main = `
  return cjson.encode(generate(cjson.decode(ARGV[1])))
`;
