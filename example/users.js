/**
 * Copyright (c) 2016 Christopher M. Baker
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */

var redis = require('fakeredis');
var client = redis.createClient();

function TakenError($, value) {
  Error.call(this);
  Error.captureStackTrace(this, this.constructor);

  this.name = $ + 'TakenError';
  this.message = 'The ' + $.space().toLowerCase() +
    ' "' + value + '" has been taken';
  this.code = 409;
}

function NotFoundError($, value) {
  Error.call(this);
  Error.captureStackTrace(this, this.constructor);

  this.name = $ + 'NotFoundError';
  this.message = 'The ' + $.space().toLowerCase() +
    ' "' + value + '" was not found';
  this.code = 404;
}

function random(base, len) {
  var s = '';

  while (s.length < len) {
    s += Math.random().toString(base).slice(2);
  }

  return s.slice(0, len);
}

exports.getNullableUserIdForUsernameFromUsername = function (username, done) {
  console.log('searching username:', username);
  client.hget('usernames', username, done);
};

exports.getNullableUserIdForEmailFromEmail = function (email, done) {
  console.log('searching email:', email);
  client.hget('emails', email, done);
};

exports.getUserIdFromUserIdForUsername = function (id, done) {
  done(null, id);
};

exports.getUserIdFromUserIdForEmail = function (id, done) {
  done(null, id);
};

exports.getNullableUserFromUserId = function (id, done) {
  console.log('searching user id:', id);
  return client.hgetall('user:' + id, done);
};

exports.getIsAvailable$From$AndNullableUserIdFor$ =
  function ($, value, id, done) {
    if (id) {
      return done(new TakenError($, value));
    }

    done();
  };

exports.getAvailable$From$AndIsAvailable$ =
  function ($, value, available, done) {
    done(null, value);
  };

exports.getIsRegistered$FromNullableUserIdFor$And$ =
  function ($, id, value, done) {
    if (id) {
      return done();
    }

    done(new NotFoundError($, value));
  };

exports.getRegistered$From$AndIsRegistered$ =
  function ($, value, registered, done) {
    done(null, value);
  };

exports.getRegisteredUserFromAvailableUsernameAndAvailableEmail =
  function (username, email, done) {
    var id = random(36, 25);

    var user = {
      id: id,
      username: username,
      email: email
    };

    console.log('creating user:', user);

    client.multi()
      .hmset('user:' + id, user)
      .hset('usernames', username, id)
      .hset('emails', email, id)
      .exec(function (error) {
        done(error, user);
      });
  };
