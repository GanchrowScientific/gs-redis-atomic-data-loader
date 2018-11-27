# Codeless redis data loader!!!

## What does that mean?

Let me show you

```bash
redis-cli lpush phish down
redis-cli lpush in with
redis-cli lpush the disease
redis-cli lpush c food

redis-cli hset Rach no 2
redis-cli hset me is cool
redis-cli hset sideways paul giamathioahiad
```

```javascript
{
  FOO: {
    loadArray: ['phish', 'in', 'the', 'c']
  },
  BAR: {
    loadHash: ['Rach', 'me', 'sideways']
  }
}
```

## Okay?  What on Earth are you talking about?

Well persons, with just a simple Javascript Object, the gs-redis-atomic-data-loader does the rest for you

Behold!  The result:

```javascript
{
  FOO: ['down', 'with', 'disease', 'food'],
  BAR: {
    no: 2,
    is: 'cool',
    paul: 'giamathioahiad'
  }
}
```

## This isn't telling me anything

Fine then.  Maybe this will help?

```typescript
import {RedisAtomicDataLoader} from 'gs-redis-atomic-data-loader';

let loader = new RedisAtomicDataLoader(redisClient, configFromAbove);
loader.on('done', (cache) => {
  /* cache == resultFromAbove */
});
```

## Neat, I guess.  What else?

Not much I'm afraid, although items can be reloaded

```typescript
let config = Object.assign(configFromAbove, {persist: 'loadAgain!!!'});
let loader = new RedisAtomicDataLoader(redisClient, config);
```

```
redis-cli lpush phish fee
redis-cli publish loadAgain!!! FOO
```

Hopefully (yes, sigh, hopefully) your cache result above now has added 'fee' to the FOO array 

Notice the *on* method used rather than *once*.  Each time data is reloaded, the done event is fired.

## The naming leaves much to be desired

Okay, how about liftraft, cherrypie, humptydumpty, codelesschico, chipsandsalsa ...

Shoot I forgot to mention the most important part

```
npm install gs-redis-atomic-data-loader
```

Followed by (after a few seconds probably)

```
npm uninstall gs-redis-atomic-data-loader
```

## I want to Contribute

So do I :(

Oh, to this project.

Fork, create branch, make changes, push with well-formatted commit message, create pull-request

(This change will **"commit message"**, first letter uppercase)
