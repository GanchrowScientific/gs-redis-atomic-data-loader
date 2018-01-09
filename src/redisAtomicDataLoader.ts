/* Copyright © 2016-2018 Ganchrow Scientific, SA all rights reserved */

'use strict';

import {PrivateEventEmitter} from 'gs-utils/lib/privateEventEmitter';
import {isObject} from 'gs-utils/lib/utilities';
import {getLogger} from 'gs-utils/lib/gsLogger';
import {LUA_COMMANDS} from './luaCommands';

const logger = getLogger('RedisAtomicDataLoader');

const LUA_EVAL = Object.keys(LUA_COMMANDS).map(cmd => LUA_COMMANDS[cmd]).join('');
const LUA_ALLOWED_COMMANDS = ['loadHash', 'loadArray', 'loadKeys'];
const BUSY_RETRY_DELAY = 2000;

export interface RedisAtomicClientConfiguration {
  [sig: string]: any;
  persist?: string;
}

export interface RedisAtomicClient {
  duplicate(): RedisAtomicClient;
  eval(script: string, numArgs: number, arg: any, cb?: Function);
  subscribe(pattern: string, cb?: Function): void;
  psubscribe(pattern: string, cb?: Function): void;
  on(type: string, cb: Function): void;
}

export class RedisAtomicDataLoader extends PrivateEventEmitter {
  protected isPersisted: boolean;

  public static configurationValidator(config: Object) {
    return Object.keys(config).filter(key => {
      if (isObject(config[key]) &&
           Object.keys(config[key]).length &&
           Object.keys(config[key]).every(item => LUA_ALLOWED_COMMANDS.includes(item))
         ) {
        return false;
      }
      return true;
    });
  }

  constructor(private client: RedisAtomicClient, private config: RedisAtomicClientConfiguration) {
    super();
    this.createPersistence(config.persist);
    delete config.persist;
  }

  public load(partialKey?: string) {
    let partialConfig = partialKey ? { [partialKey]: this.config[partialKey] } : this.config;
    if (partialKey && !partialConfig[partialKey]) {
      this.emit('error', new Error(`Invalid config key ${partialKey}`));
      return;
    }
    this.client.eval(LUA_EVAL, 0, JSON.stringify(partialConfig), (err, res) => {
      if (err) {
        logger.error(err);
        if (this.isBusyWaitingError(err)) {
          setTimeout(() => this.load(partialKey), BUSY_RETRY_DELAY);
        } else {
          this.emit('error', err);
        }
      } else {
        this.emit('done', JSON.parse(res));
      }
    });
  }

  public subscribe(ch: string, cb: Function) {
    let subscriptionClient = this.client.duplicate();
    subscriptionClient.on('message', (channel, message) => {
      if (channel === ch) {
        cb(message, channel);
      }
    });
    subscriptionClient.subscribe(ch);
  }

  public psubscribe(ch: string, cb: Function) {
    let subscriptionClient = this.client.duplicate();
    subscriptionClient.on('pmessage', (pattern, channel, message) => {
      cb(message, pattern, channel);
    });
    subscriptionClient.psubscribe(ch);
  }

  private isBusyWaitingError(err: Error) {
    return /BUSY/.test(err.message);
  }

  private createPersistence(persistChannel: string) {
    if (!persistChannel) {
      return;
    }
    let subscriptionClient = this.client.duplicate();
    this.isPersisted = true;
    this.once('done', (...args: any[]) => {
      subscriptionClient.on('message', (channel, message: string) => {
        if (channel === persistChannel) {
          this.load(message);
        }
      });
      subscriptionClient.subscribe(persistChannel);
    });
  }
}
