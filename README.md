# ziploc
[![npm package](https://badge.fury.io/js/ziploc.svg)](http://badge.fury.io/js/ziploc)
[![build](https://travis-ci.org/bakerface/ziploc.svg?branch=master)](https://travis-ci.org/bakerface/ziploc)
[![code climate](https://codeclimate.com/github/bakerface/ziploc/badges/gpa.svg)](https://codeclimate.com/github/bakerface/ziploc)
[![coverage](https://codeclimate.com/github/bakerface/ziploc/badges/coverage.svg)](https://codeclimate.com/github/bakerface/ziploc/coverage)
[![issues](https://img.shields.io/github/issues/bakerface/ziploc.svg)](https://github.com/bakerface/ziploc/issues)
[![dependencies](https://david-dm.org/bakerface/ziploc.svg)](https://david-dm.org/bakerface/ziploc)
[![devDependencies](https://david-dm.org/bakerface/ziploc/dev-status.svg)](https://david-dm.org/bakerface/ziploc#info=devDependencies)
[![downloads](http://img.shields.io/npm/dm/ziploc.svg)](https://www.npmjs.com/package/ziploc)

The purpose of this package is to provide a framework for aggregating simple,
independent services into a complete system. Let's take an example:

Lets assume we have a redis database containing a collection of users. Lets also
assume that users are indexed by a unique `id` property, as well as a unique
`username` property. A simple `users.js` might be the following:

``` javascript
var redis = require('redis');
var client = redis.createClient();

exports.getUserIdFromUsername = function (username, done) {
  client.hget('usernames', username, done);
};

exports.getUserFromUserId = function (id, done) {
  client.hgetall('user:' + id, done);
};
```

More often than not, the majority of our time developing software is spent
combining these independent functions into larger, more complex functions. For
example, in addition to the `users.js` above, one might want to create another
function that combines the two as follows:

``` javascript
exports.getUserFromUsername = function (username, done) {
  exports.getUserIdFromUsername(username, function (error, id) {
    if (error) {
      return done(error);
    }

    exports.getUserFromUserId(id, done);
  });
};
```

While this may not seem like an issue at first, eventually you will realize that
there is no value added from this additional function. Moreover, functions like
this can often make up more half of our code base.

If we can assume a consistent naming convention for functions, then we can
create these intermediate functions on the fly. This package assumes the
following naming conventions:

| Function Name       | Produces | Consumes |
|:--------------------|:---------|:---------|
| getFoo              | Foo      |          |
| getFooFromBar       | Foo      | Bar      |
| getFooFromBarAndBaz | Foo      | Bar, Baz |

Here is a basic example:

``` javascript
var ziploc = require('ziploc');

var instance = {
  getUserIdFromUsername: function (username, done) {
    done(null, username + '1234');
  },

  getEmailFromUserId: function (id, done) {
    done(null, id + '@example.com');
  }
};

ziploc
  .use(instance)
  .given('Username', 'john')
  .resolve('Email', function (error, email) {
    console.log(email); // john1234@example.com
  });
```

As you can see, the intermediate `getEmailFromUsername` function is no longer
required. The package handles the transition automatically.

Templates are another feature provided by this package. They are used to
eliminate duplicate code. Let's look at another example:

``` javascript
var ziploc = require('ziploc');

var instance = {
  get$FromNullable$: function ($, value, done) {
    if (value) {
      return done(null, value);
    }

    done(new ReferenceError($));
  }
};

ziploc
  .use(instance)
  .given('NullableUsername', 'john')
  .resolve('Username', function (error, username) {
    console.log(username); // john
  });

ziploc
  .use(instance)
  .given('NullableUsername', null)
  .resolve('Username', function (error, username) {
    console.error(error); // ReferenceError: Username
  });
```

This package also provides convenience methods for creating express
middleware. Let's look at an example:

``` javascript
var ziploc = require('ziploc')
var express = require('express');
var app = express();

app.get('/users/:username', ziploc
  .express('ExpressRequest') // request type (defaults to 'Request')
  .status(200)               // status code to respond with on success
  .json('User'));            // the type to resolve

app.listen(3000);
```

For a more complete example using express, take a look [here](example). Pull
requests and bug reports are welcome, as always.
