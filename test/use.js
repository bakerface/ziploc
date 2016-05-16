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

describe('ziploc.use(instance)', function () {
  var instance;

  beforeEach(function () {
    instance = { };
  });

  describe('when the instance has no routes', function () {
    it('should return an error when resolving', function (done) {
      ziploc.use(instance).resolve('Unknown', function (error) {
        assert.deepEqual(error, new TypeError('Unknown'));
        done();
      });
    });
  });

  describe('when the instance has a direct route', function () {
    beforeEach(function () {
      instance.getFoo = function (done) {
        done(null, 'foo');
      };

      instance.bar = 'bar';

      instance.getBar = function (done) {
        done(null, this.bar);
      };
    });

    it('should resolve using functions from instance', function (done) {
      ziploc.use(instance).resolve('Foo', function (error, foo) {
        assert.strictEqual(error, null);
        assert.strictEqual(foo, 'foo');
        done();
      });
    });

    it('should bind to the instance', function (done) {
      ziploc.use(instance).resolve('Bar', function (error, bar) {
        assert.strictEqual(error, null);
        assert.strictEqual(bar, 'bar');
        done();
      });
    });
  });

  describe('when the instance has an indirect route', function () {
    beforeEach(function () {
      instance.getOne = function (done) {
        done(null, 1);
      };

      instance.getTwoFromOne = function (one, done) {
        done(null, one + one);
      };

      instance.getThreeFromOneAndTwo = function (one, two, done) {
        done(null, one + two);
      };

      instance.getFiveFromTwoAndThree = function (two, three, done) {
        done(null, two + three);
      };
    });

    it('should resolve dependencies first', function (done) {
      ziploc.use(instance).resolve('Five', function (error, five) {
        assert.strictEqual(error, null);
        assert.strictEqual(five, 5);
        done();
      });
    });
  });

  describe('when the instance has a templated route', function () {
    beforeEach(function () {
      instance.getLowerCase$ = function ($, done) {
        done(null, $.toLowerCase());
      };

      instance.getUpperCase$ = function ($, done) {
        done(null, $.toUpperCase());
      };

      instance.getCamelCase$ = function ($, done) {
        done(null, $.toCamelCase());
      };

      instance.getSpaced$ = function ($, done) {
        done(null, $.space());
      };

      instance.get$ = function ($, done) {
        done(null, $);
      };

      instance.getFooBarFromFooAndBar = function (foo, bar, done) {
        done(null, foo + bar);
      };
    });

    it('should pass the template to the function', function (done) {
      ziploc.use(instance).resolve('FooBar', function (error, foobar) {
        assert.strictEqual(error, null);
        assert.strictEqual(foobar, 'FooBar');
        done();
      });
    });

    it('should be able to lowercase', function (done) {
      ziploc.use(instance).resolve('LowerCaseFooBar', function (error, foobar) {
        assert.strictEqual(error, null);
        assert.strictEqual(foobar, 'foobar');
        done();
      });
    });

    it('should be able to uppercase', function (done) {
      ziploc.use(instance).resolve('UpperCaseFooBar', function (error, foobar) {
        assert.strictEqual(error, null);
        assert.strictEqual(foobar, 'FOOBAR');
        done();
      });
    });

    it('should be able to camelcase', function (done) {
      ziploc.use(instance).resolve('CamelCaseFooBar', function (error, foobar) {
        assert.strictEqual(error, null);
        assert.strictEqual(foobar, 'fooBar');
        done();
      });
    });

    it('should be able to space', function (done) {
      ziploc.use(instance).resolve('SpacedFooBar', function (error, foobar) {
        assert.strictEqual(error, null);
        assert.strictEqual(foobar, 'Foo Bar');
        done();
      });
    });
  });

  describe('when the instance has duplicate routes', function () {
    beforeEach(function () {
      instance.getFoo = function (done) {
        done(null, 'foo');
      };

      instance.getFooFromBar = function () { };
    });

    it('should prioritize the route with less dependencies', function (done) {
      ziploc.use(instance).resolve('Foo', function (error, foo) {
        assert.strictEqual(error, null);
        assert.strictEqual(foo, 'foo');
        done();
      });
    });
  });

  describe('when the instance has a direct route that fails', function () {
    beforeEach(function () {
      instance.getFoo = function (done) {
        done(null, 'foo');
      };

      instance.getBar = function (done) {
        done(new ReferenceError('Bar'));
      };

      instance.getFooBarFromFooAndBar = function (foo, bar, done) {
        done(null, foo + bar);
      };
    });

    it('should return an error when resolving', function (done) {
      ziploc.use(instance).resolve('FooBar', function (error) {
        assert.deepEqual(error, new ReferenceError('Bar'));
        done();
      });
    });
  });

  describe('when the instance has a templated route that fails', function () {
    beforeEach(function () {
      instance.getFoo$From$ = function ($, value, done) {
        done(null, 'foo' + value);
      };

      instance.getBar = function (done) {
        done(new ReferenceError('Bar'));
      };
    });

    it('should return an error when resolving', function (done) {
      ziploc.use(instance).resolve('FooBar', function (error) {
        assert.deepEqual(error, new ReferenceError('Bar'));
        done();
      });
    });
  });

  describe('when the instance has multiple routes that fail', function () {
    beforeEach(function () {
      instance.getBar = function (done) {
        done(null, 'bar');
      };

      instance.getFoo = function (done) {
        done(new ReferenceError('getFoo'));
      };

      instance.getFooFromBar = function (bar, done) {
        done(new ReferenceError('getFooFromBar'));
      };
    });

    it('should return the first error when resolving', function (done) {
      ziploc.use(instance).resolve('Foo', function (error) {
        assert.deepEqual(error, new ReferenceError('getFoo'));
        done();
      });
    });
  });

  describe('when the instance has a recursive template', function () {
    beforeEach(function () {
      instance.getFoo = function (done) {
        done(null, 'foo');
      };

      instance.getBar = function (done) {
        done(null, 'bar');
      };

      instance.get$FromFooAndBar = function ($, foo, bar, done) {
        done(null, foo + bar);
      };
    });

    it('should prevent infinite recursion', function (done) {
      ziploc.use(instance).resolve('FooBar', function (error, foobar) {
        assert.strictEqual(error, null);
        assert.strictEqual(foobar, 'foobar');
        done();
      });
    });
  });
});
