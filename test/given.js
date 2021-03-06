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
var assert = require('assert');

describe('ziploc.given(type, value)', function () {
  it('should resolve type to value', function (done) {
    ziploc.given('Foo', 'foo').resolve('Foo', function (error, foo) {
      assert.strictEqual(error, null);
      assert.strictEqual(foo, 'foo');
      done();
    });
  });

  it('should have higher priority than resolve functions', function (done) {
    ziploc
      .use({
        getFoo: function () {
          return 'FOO';
        }
      })
      .given('Foo', 'foo')
      .resolve('Foo', function (error, foo) {
        assert.strictEqual(error, null);
        assert.strictEqual(foo, 'foo');
        done();
      });
  });
});
