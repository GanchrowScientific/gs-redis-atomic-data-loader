/* Copyright © 2016-2018 Ganchrow Scientific, SA all rights reserved */

'use strict';

// include this line to fix stack traces
import 'source-map-support/register';

import * as sinon from 'sinon';
import 'jasmine';

import {RedisAtomicDataLoader} from '../src/redisAtomicDataLoader';

const HAS_PERSISTENCE = 'isPersisted';
const EMIT_KEY = 'emit';

const COMMANDS = [
  'duplicate',
  'eval',
  'on',
  'quit'
];

let client: any;

describe('RedisAtomicDataLoader', () => {
  beforeEach(() => {
    client = createFakeRedis();
  });

  it('should load', done => {
    let rmc = new RedisAtomicDataLoader(client, { key1: 9 });
    rmc.load();
    expect(!rmc[HAS_PERSISTENCE]).toBeTruthy();
    expect(client.eval.calledOnce).toBeTruthy();
    expect(client.eval.getCall(0).args[2]).toEqual(JSON.stringify({ key1: 9 }));

    rmc.on('done', val => {
      expect(val).toEqual('result');
      expect(client.quit.notCalled).toBeTruthy();
      rmc.quit();
      expect(client.quit.calledOnce).toBeTruthy();
      done();
    });
    rmc.on('error', val => {
      expect(false).toBeTruthy();
      done();
    });
    client.eval.getCall(0).args[3](null, '"result"');
  });

  it('should load with error', done => {
    let rmc = new RedisAtomicDataLoader(client, { key1: 9 });
    rmc.load();
    expect(!rmc[HAS_PERSISTENCE]).toBeTruthy();
    expect(client.eval.calledOnce).toBeTruthy();
    expect(client.eval.getCall(0).args[2]).toEqual(JSON.stringify({ key1: 9 }));

    rmc.on('done', val => {
      expect(false).toBeTruthy();
      done();
    });
    rmc.on('error', val => {
      expect(val).toEqual('error');
      done();
    });
    client.eval.getCall(0).args[3]('error', 'result');
  });

  it('should load partial key', done => {
    let rmc = new RedisAtomicDataLoader(client, { key1: 9, key2: 10 });
    rmc.load('key1');
    rmc.load('key2');
    expect(client.eval.calledTwice).toBeTruthy();
    expect(client.eval.getCall(0).args[2]).toEqual(JSON.stringify({ key1: 9 }));
    expect(client.eval.getCall(1).args[2]).toEqual(JSON.stringify({ key2: 10 }));
    done();
  });

  it('should load invalid partial key', done => {
    let rmc = new RedisAtomicDataLoader(client, { key1: 9, key2: 10 });
    rmc.on('done', val => {
      expect(false).toBeTruthy();
      done();
    });
    rmc.on('error', err => {
      expect(err.message).toEqual('Invalid config key key3');
      expect(client.eval.callCount).toEqual(0);
      done();
    });
    rmc.load('key3');
  });

  it('should handle persistence', done => {
    let rmc = new RedisAtomicDataLoader(client, { persist: 'hey' });
    expect(rmc[HAS_PERSISTENCE]).toBeTruthy();
    done();
  });

  it('should subscribe', done => {
    let rmc = new RedisAtomicDataLoader(client, {});
    let spy = sinon.spy();
    rmc.subscribe('my-channel', spy);
    expect(client.duplicate().subscribe.calledOnce).toBeTruthy();
    expect(client.duplicate().on.calledOnce).toBeTruthy();
    expect(client.duplicate().subscribe.calledWithExactly('my-channel')).toBeTruthy();

    client.duplicate().on.firstCall.args[1]('my-channel', 'my-message');
    expect(spy.callCount).toEqual(1);
    expect(spy.firstCall.args).toEqual(['my-message', 'my-channel']);
    expect(client.duplicate().quit.notCalled).toBeTruthy();
    rmc[EMIT_KEY]('quit');
    expect(client.duplicate().quit.calledOnce).toBeTruthy();
    done();
  });

  it('should psubscribe', done => {
    let rmc = new RedisAtomicDataLoader(client, {});
    let spy = sinon.spy();
    rmc.psubscribe('my-channel', spy);
    expect(client.duplicate().psubscribe.calledOnce).toBeTruthy();
    expect(client.duplicate().on.calledOnce).toBeTruthy();
    expect(client.duplicate().psubscribe.calledWithExactly('my-channel')).toBeTruthy();

    client.duplicate().on.firstCall.args[1]('my-pattern', 'my-channel', 'my-message');
    expect(spy.firstCall.args).toEqual(['my-message', 'my-pattern', 'my-channel']);
    expect(client.duplicate().quit.notCalled).toBeTruthy();
    rmc[EMIT_KEY]('quit');
    expect(client.duplicate().quit.calledOnce).toBeTruthy();
    done();
  });

  it('should load with persistence', done => {
    let rmc = new RedisAtomicDataLoader(client, { persist: 'hey' });
    rmc.load();
    expect(rmc[HAS_PERSISTENCE]).toBeTruthy();
    rmc[EMIT_KEY]('done', null);
    rmc[EMIT_KEY]('done', null);
    expect(client.duplicate().subscribe.calledOnce).toBeTruthy();
    expect(client.duplicate().on.calledOnce).toBeTruthy();
    expect(client.duplicate().subscribe.calledWithExactly('hey')).toBeTruthy();
    done();
  });

  it('should validator configuration', done => {
    expect(RedisAtomicDataLoader.configurationValidator({
      foo: {
        loadArray: true
      },
      bar: {
        loadHash: true
      },
      baz: {
        loadDummy: true
      },
      hucairz: [],
      attackOfTheShow: 'hey'
    }).sort()).toEqual(['hucairz', 'attackOfTheShow', 'baz'].sort());
    done();
  });

  it('should load with no persistence', done => {
    let rmc = new RedisAtomicDataLoader(client, {});
    rmc.load();
    expect(!rmc[HAS_PERSISTENCE]).toBeTruthy();
    rmc[EMIT_KEY]('done', null);
    expect(!client.duplicate().subscribe.calledOnce).toBeTruthy();
    expect(!client.duplicate().on.calledOnce).toBeTruthy();
    done();
  });
});

function createFakeRedis(commands = COMMANDS) {
  let cmdObj: any = {};
  commands.forEach(cmd => {
    cmdObj[cmd] = sinon.stub();
    if (cmd === 'duplicate') {
      cmdObj[cmd].returns({
        on: sinon.stub(),
        psubscribe: sinon.stub(),
        subscribe: sinon.stub(),
        quit: sinon.stub()
      });
    }
  });
  return cmdObj;
}
