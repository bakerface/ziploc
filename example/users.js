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

function UsernameTakenError(username) {
  Error.call(this);
  Error.captureStackTrace(this, this.constructor);

  this.name = 'UsernameTakenError';
  this.message = 'The specified username has been taken';
  this.username = username;
  this.code = 409;
}

function UsernameNotFoundError(username) {
  Error.call(this);
  Error.captureStackTrace(this, this.constructor);

  this.name = 'UsernameNotFoundError';
  this.message = 'The specified username is not registered';
  this.username = username;
  this.code = 404;
}

function EmailTakenError(email) {
  Error.call(this);
  Error.captureStackTrace(this, this.constructor);

  this.name = 'EmailTakenError';
  this.message = 'The specified email has been taken';
  this.email = email;
  this.code = 409;
}

function EmailNotFoundError(email) {
  Error.call(this);
  Error.captureStackTrace(this, this.constructor);

  this.name = 'EmailNotFoundError';
  this.message = 'The specified email is not registered';
  this.email = email;
  this.code = 404;
}

function random(base, len) {
  var s = '';

  while (s.length < len) {
    s += Math.random().toString(base).slice(2);
  }

  return s.slice(0, len);
}

exports.getNullableUserIdFromUsername = function (username, done) {
  client.hget('usernames', username, done);
};

exports.getNullableUserFromUserId = function (id, done) {
  client.hgetall('user:' + id, done);
};

exports.getUserFromAvailableUsername = function (username, done) {
  done(new UsernameNotFoundError(username));
};

exports.getIsAvailableUsernameFromUsernameAndNullableUserId =
  function (username, id, done) {
    if (id) {
      return done(new UsernameTakenError(username));
    }

    done();
  };

exports.getAvailableUsernameFromUsernameAndIsAvailableUsername =
  function (username, available, done) {
    done(null, username);
  };

exports.getIsRegisteredUsernameFromUsernameAndNullableUserId =
  function (username, id, done) {
    if (id) {
      return done();
    }

    done(new UsernameNotFoundError(username));
  };

exports.getIsAvailableEmailFromEmailAndNullableUserId =
  function (email, id, done) {
    if (id) {
      return done(new EmailTakenError(email));
    }

    done();
  };

exports.getAvailableEmailFromEmailAndIsAvailableEmail =
  function (email, available, done) {
    done(null, email);
  };

exports.getIsRegisteredEmailFromEmailAndNullableUserId =
  function (email, id, done) {
    if (id) {
      return done();
    }

    done(new EmailNotFoundError(email));
  };

exports.getRegisteredEmailFromEmailAndIsRegisteredEmail =
  function (email, registered, done) {
    done(null, email);
  };

exports.getRegisteredEmailFromEmailAndIsRegisteredEmail =
  function (email, registered, done) {
    done(null, email);
  };

exports.getRegisteredUserFromAvailableUsernameAndAvailableEmail =
  function (username, email, done) {
    var id = random(36, 25);

    var user = {
      id: id,
      username: username,
      email: email
    };

    client.multi()
      .hmset('user:' + id, user)
      .hset('usernames', username, id)
      .hset('emails', email, id)
      .exec(function (error) {
        done(error, user);
      });
  };
