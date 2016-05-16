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

var express = require('express');
var bodyParser = require('body-parser');
var nullable = require('./nullable');
var request = require('./request');
var users = require('./users');

var ziploc = require('..')
  .use(nullable, request, users);

var app = express();

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
  extended: false
}));

app.get('/v1/users/:username',
  ziploc.express().status(200).json('User'));

app.get('/v1/users/:username/available',
  ziploc.express().status(200).json('IsAvailableUsername'));

app.get('/v1/users/:username/registered',
  ziploc.express().status(200).json('IsRegisteredUsername'));

app.post('/v1/users/:username/register',
  ziploc.express().status(200).json('RegisteredUser'));

app.use(function (err, req, res, _next) {
  var code = (err.code | 0) || 500;
  var name = err.name || 'Error';
  var message = err.message || 'An unexpected error has occurred';

  res.status(code).json({
    name: name,
    message: message
  });
});

app.listen(process.env.PORT || 3000);
