/* Copyright © 2016-2017 Ganchrow Scientific, SA all rights reserved */
'use strict';

// include this line to fix stack traces
import 'source-map-support/register';

import * as redis from 'redis';
import * as nodeunit from 'nodeunit';

import {getLogger} from 'gs-utils/lib/gsLogger';

import {RedisAtomicDataLoader} from '../src/redisAtomicDataLoader';

let keys = {
  a: 'rmc-integration-test-a',
  b: 'rmc-integration-test-b',
  c: 'rmc-integration-test-c',
  d: 'rmc-integration-test-d',
  e: 'rmc-integration-test-e',
  f: 'rmc-integration-test-f',
  g: 'rmc-integration-test-g',
  h: 'rmc-integration-test-h',
};

let config = {
  EXPOSED_KEY1: {
    loadArray: [keys.a, keys.b, 'hucairz']
  },
  EXPOSED_KEY2: {
    loadHash: [keys.c, keys.d, keys.e, 'hucairz']
  },
  EXPOSED_KEY3: {
    loadKeys: [keys.f, keys.g, keys.h, 'hucairz']
  },
  EXPOSED_KEY_INVALID_COMMAND: {
    loadDummy: ['hucairz']
  },
  EXTRA_KEY_UNRELATED: true
};

let logger = getLogger('rmc integration test');

let client = redis.createClient(6380, 'saget', {
  password: 'test_me_sideways'
});
let rmc = new RedisAtomicDataLoader(<any> client, config);
let secondTestDone = false;

module.exports = {
  setUp(callback) {
    client.multi()
      .lpush(keys.a, '1', '2', JSON.stringify([3]))
      .lpush(keys.b, '4', '5', JSON.stringify({ a: 6 }))

      .hset(keys.c, 'c1', JSON.stringify({ a: 1 }))
      .hset(keys.c, 'c2', JSON.stringify({ a: 1 }))
      .hset(keys.c, 'c3', JSON.stringify({ a: 1 }))
      .hset(keys.c, 'c4', 'NOT JSON BUT SHOULD RECEIVE')

      .hset(keys.d, 'd1', JSON.stringify({ a: 1 }))
      .hset(keys.d, 'd2', JSON.stringify({ a: 1 }))
      .hset(keys.d, 'd3', JSON.stringify({ a: 1 }))

      .hset(keys.e, 'e1', JSON.stringify({ a: 1 }))
      .hset(keys.e, 'e2', JSON.stringify({ a: 1 }))
      .hset(keys.e, 'e3', JSON.stringify({ a: 1 }))

      .set(keys.f, JSON.stringify([1, 2]))
      .set(keys.g, JSON.stringify([1, 2]))
      .set(keys.h, 'NOT JSON')

      .exec(err => {
        if (err) {
          logger.error(err);
        }
        callback();
      });
  },

  testMulti(test: nodeunit.Test) {
    rmc.load();
    rmc.on('error', err2 => {
      test.ok(false, err2.message);
      test.done();
    });
    rmc.on('done', result => {
      if (!secondTestDone) {
        test.deepEqual(result, {
          EXPOSED_KEY1: [[3], 2, 1, { a: 6 }, 5, 4],
          EXPOSED_KEY2: {
            c1: { a: 1 },
            c2: { a: 1 },
            c3: { a: 1 },
            c4: 'NOT JSON BUT SHOULD RECEIVE',
            d1: { a: 1 },
            d2: { a: 1 },
            d3: { a: 1 },
            e1: { a: 1 },
            e2: { a: 1 },
            e3: { a: 1 }
          },
          EXPOSED_KEY3: {
            'rmc-integration-test-f': [1, 2],
            'rmc-integration-test-g': [1, 2]
          }
        });
        secondTest(test);
      } else {
        test.deepEqual(result, {
          EXPOSED_KEY1: [9, 8, 7, 12, 11, 10]
        });
        test.expect(2);
        test.done();
      }
    });
  },

  tearDown(callback) {
    client.del(...Object.keys(keys).map(k => keys[k]), err => {
      if (err) {
        logger.error(err);
      }
      client.quit();
      callback();
    });
  }
};

function secondTest(test: nodeunit.Test) {
  client.multi().del(keys.a, keys.b).lpush(keys.a, '7', '8', '9').lpush(keys.b, '10', '11', '12').exec(err => {
    if (err) {
      test.ok(false, err.message);
    }
    rmc.load('EXPOSED_KEY1');
    secondTestDone = true;
  });
}
