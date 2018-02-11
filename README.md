# Codeless redis data loader!!!

## What does that mean?

```
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

Well ladies, with just a simple Javascript Object, the gs-redis-atomic-data-loader does the rest for you

Behold!  The result:

```
  {
    FOO: [/* concatenation of the redis lists 'phish', 'in', 'the', 'c' */],
    BAR: { /* Merging of redis hashes 'Rach', 'me', and 'sideways' }
  }
```

## Now now chico, this isn't telling me anything

Fine then.  My name isn't chico BTW

```
import {RedisAtomicDataLoader} from 'gs-redis-atomic-data-loader';

let loader = new RedisAtomicDataLoader(redisClient, configFromAbove);
loader.on('done', (cache) => {
  /* cache == resultFromAbove */
});
```

## Neat, I guess.  What else?

Not much I'm afraid, although items can be reloaded

```
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

Followed by (after a few seconds)

```
npm uninstall gs-redis-atomic-data-loader
```

## I want to Contribute

So do I :(

Oh, to this project.  My fault.  (My fault, indeed.)
