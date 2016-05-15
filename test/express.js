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

var ziploc = require('..');
var express = require('express');
var request = require('supertest');

var instance = {
  getUsernameFromRequest: function (request, done) {
    done(null, request.params.username);
  },

  getUserFromUsername: function (username, done) {
    done(null, {
      username: username,
      email: username + '@example.com'
    });
  }
};

describe('ziploc.express(type)', function () {
  var app;

  beforeEach(function () {
    app = express();

    app.get('/users/:username', ziploc.use(instance)
      .express().status(200).json('User'));

    app.get('/error', ziploc.use(instance)
      .express().status(200).json('Error'));
  });

  it('should resolve type', function (done) {
    request(app)
      .get('/users/john')
      .expect(200, {
        username: 'john',
        email: 'john@example.com'
      }, done);
  });

  it('should forward errors', function (done) {
    request(app)
      .get('/error')
      .expect(500, done);
  });
});
