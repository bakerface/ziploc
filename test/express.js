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
  getUsernameFromRequest: function (request) {
    return request.params.username;
  },

  getUserFromUsername: function (username) {
    return {
      username: username,
      email: username + '@example.com'
    };
  },

  getUserLocationFromUsername: function (username) {
    return '/users/' + username;
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

    app.post('/users/:username', ziploc.use(instance)
      .express().status(200).location('UserLocation').json('User'));

    app.post('/users/:username/json_error', ziploc.use(instance)
      .express().status(200).location('UserLocation').json('Error'));

    app.post('/users/:username/location_error', ziploc.use(instance)
      .express().status(200).location('Error').json('User'));

    app.use(function (err, req, res, _next) {
      res.status(500).json(err);
    });
  });

  it('should resolve the JSON type', function (done) {
    request(app)
      .get('/users/john')
      .expect(200, {
        username: 'john',
        email: 'john@example.com'
      }, done);
  });

  it('should forward JSON errors', function (done) {
    request(app)
      .get('/error')
      .expect(500, done);
  });

  it('should resolve the location type', function (done) {
    request(app)
      .post('/users/john')
      .expect('Location', '/users/john')
      .expect(200, {
        username: 'john',
        email: 'john@example.com'
      }, done);
  });

  it('should forward JSON errors', function (done) {
    request(app)
      .post('/users/john/json_error')
      .expect(500, done);
  });

  it('should forward location errors', function (done) {
    request(app)
      .post('/users/john/location_error')
      .expect(500, done);
  });
});
