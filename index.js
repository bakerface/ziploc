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

var Ziploc = module.exports = function (contents, givens) {
  this.contents = contents || [];
  this.givens = givens || [];
};

Ziploc.prototype.add = function (content) {
  return new Ziploc(this.contents.concat(content), this.givens);
};

function isUsable(instance) {
  return function (name) {
    return typeof instance[name] === 'function' &&
      name.length > 3 &&
      name.slice(0, 3) === 'get';
  };
}

function toContent(instance) {
  return function (name) {
    var index = name.indexOf('From');
    var resolve = instance[name];

    if (index < 0) {
      return {
        type: name.slice(3),
        dependencies: [],
        resolve: resolve,
        instance: instance
      };
    }

    return {
      type: name.slice(3, index),
      dependencies: name.slice(index + 4).split('And'),
      resolve: resolve,
      instance: instance
    };
  };
}

function useContent(ziploc, content) {
  return ziploc.add(content);
}

function use(ziploc, instance) {
  return Object.getOwnPropertyNames(instance)
    .filter(isUsable(instance))
    .map(toContent(instance))
    .reduce(useContent, ziploc);
}

function flatten(args) {
  return [].concat.apply([], args);
}

Ziploc.prototype.use = function () {
  return flatten(arguments).reduce(use, this);
};

Ziploc.use = function () {
  return new Ziploc().use(flatten(arguments));
};

Ziploc.prototype.given = function (type, value) {
  return new Ziploc(this.contents.slice(), this.givens.concat({
    type: type,
    value: value
  }));
};

Ziploc.given = function (type, value) {
  return new Ziploc().given(type, value);
};

function series(tasks, done) {
  var values = [];

  function append(error, value) {
    if (error) {
      return done(error);
    }

    values.push(value);
    next();
  }

  function next() {
    if (tasks.length > 0) {
      return tasks.shift()(append);
    }

    done(null, values);
  }

  next();
}

function first(tasks, done) {
  var firstError;

  function _done(error, value) {
    if (!error) {
      return done(null, value);
    }

    if (!firstError) {
      firstError = error;
    }

    next();
  }

  function next() {
    var task = tasks.shift();

    if (task) {
      return task(_done);
    }

    done(firstError);
  }

  next();
}

function invoke(fn, instance, args, done) {
  var result;
  var called = false;

  function callback(error, value) {
    if (called) {
      return false;
    }

    called = true;

    setTimeout(function () {
      done(error, value);
    }, 0);
  }

  try {
    result = fn.apply(instance, args.concat(callback));
  }
  catch (error) {
    return callback(error);
  }

  if (result && typeof result.then === 'function') {
    return result.then(function (value) {
      callback(null, value);
    }, callback);
  }

  if (fn.length <= args.length) {
    return callback(null, result);
  }
}

function canResolveExplicit(type) {
  return function (content) {
    return content.type === type;
  };
}

function save(cache, type, done) {
  return function (error, value) {
    if (error) {
      return done(error, value);
    }

    cache[type] = value;
    return done(error, value);
  };
}

function createExplicitResolver(cache, contents) {
  return function (content) {
    return function (done) {
      resolveExplicit(cache, contents, content, done);
    };
  };
}

function resolveExplicit(cache, contents, content, done) {
  var tasks = content.dependencies
    .map(createTypeResolver(cache, contents));

  series(tasks, function (error, args) {
    if (error) {
      return done(error);
    }

    invoke(content.resolve, content.instance, args,
      save(cache, content.type, done));
  });
}

function isTemplated(type) {
  return type.indexOf('$') >= 0;
}

function rename(replacement) {
  return function (value) {
    return value.replace(/\$/g, replacement);
  };
}

function toExpression(type) {
  return '^' + rename('([A-Za-z0-9$]+)')(type) + '$';
}

function getMatchForTemplate(type, template) {
  return type.match(toExpression(template));
}

function isMatchForTemplate(type, template) {
  return getMatchForTemplate(type, template);
}

function isRecursive(type, content) {
  var recursive = content.dependencies
    .filter(function (dependency) {
      return isMatchForTemplate(dependency, content.type) &&
        isMatchForTemplate(type, dependency);
    });

  return recursive.length > 0;
}

function canResolveImplicit(type) {
  return function (content) {
    return isTemplated(content.type) &&
      isMatchForTemplate(type, content.type) &&
      !isRecursive(type, content);
  };
}

function createImplicitResolver(cache, contents, type) {
  return function (content) {
    return function (done) {
      resolveImplicit(cache, contents, type, content, done);
    };
  };
}

function Template(type) {
  this.type = type;
}

Template.prototype.toString = function () {
  return this.type;
};

Template.prototype.toCamelCase = function () {
  return this.type[0].toLowerCase() + this.type.slice(1);
};

Template.prototype.toUpperCase = function () {
  return this.type.toUpperCase();
};

Template.prototype.toLowerCase = function () {
  return this.type.toLowerCase();
};

Template.prototype.join = function (value) {
  return this.type[0] +
    this.type.slice(1).replace(/[A-Z]/g, function (c) {
      return value + c;
    });
};

Template.prototype.space = function () {
  return this.join(' ');
};

Template.prototype.toSnakeCase = function () {
  return this.join('_');
};

Template.prototype.toKebabCase = function () {
  return this.join('-');
};

function resolveImplicit(cache, contents, type, content, done) {
  var template = getMatchForTemplate(type, content.type)[1];

  var tasks = content.dependencies
    .map(rename(template))
    .map(createTypeResolver(cache, contents));

  series(tasks, function (error, args) {
    if (error) {
      return done(error);
    }

    args.unshift(new Template(template));

    invoke(content.resolve, content.instance, args,
      save(cache, type, done));
  });
}

function createTypeResolver(cache, contents) {
  return function (type) {
    return function (done) {
      resolveType(cache, contents, type, done);
    };
  };
}

function resolveType(cache, contents, type, done) {
  if (type in cache) {
    return done(null, cache[type]);
  }

  var explicit = contents.filter(canResolveExplicit(type))
    .map(createExplicitResolver(cache, contents));

  var implicit = contents.filter(canResolveImplicit(type))
    .map(createImplicitResolver(cache, contents, type));

  var tasks = explicit.concat(implicit);

  if (tasks.length === 0) {
    return done(new TypeError(type));
  }

  first(tasks, done);
}

function random(base, length) {
  var s = '';

  while (s.length < length) {
    s += Math.random().toString(base).slice(2);
  }

  return s.slice(0, length);
}

function uuid() {
  return 'ziploc:' + random(36, 25);
}

function getDependenciesForObject(object) {
  return Object.getOwnPropertyNames(object)
    .map(function (name) {
      return object[name];
    });
}

function assignResolvedProperty(object, dependencies, resolved) {
  return function (target, property) {
    var type = object[property];
    var index = dependencies.indexOf(type);
    var value = resolved[index];

    target[property] = value;
    return target;
  };
}

function resolveObjectFromDependencies(object, dependencies) {
  return function () {
    return Object.getOwnPropertyNames(object).reduce(
      assignResolvedProperty(object, dependencies, arguments), { });
  };
}

function reduceCreateCache(cache, given) {
  cache[given.type] = given.value;
  return cache;
}

function createCache(givens) {
  return givens.reduce(reduceCreateCache, { });
}

Ziploc.prototype.resolve = function (type, done) {
  if (typeof type === 'object') {
    var dependencies = getDependenciesForObject(type);

    var content = {
      type: uuid(),
      dependencies: dependencies,
      resolve: resolveObjectFromDependencies(type, dependencies)
    };

    return this.add(content).resolve(content.type, done);
  }

  resolveType(createCache(this.givens), this.contents, type, done);
};

Ziploc.prototype.express = function (request) {
  return new Express(this, request || 'Request');
};

function Express(ziploc, request) {
  this.ziploc = ziploc;
  this.request = request;
}

Express.prototype.status = function (code) {
  return new ExpressStatus(this.ziploc, this.request, code);
};

function ExpressStatus(ziploc, request, code) {
  this.ziploc = ziploc;
  this.request = request;
  this.code = code;
}

ExpressStatus.prototype.location = function (where) {
  return new ExpressStatusLocation(this.ziploc, this.request, this.code, where);
};

ExpressStatus.prototype.json = function (response) {
  var ziploc = this.ziploc;
  var request = this.request;
  var code = this.code;

  return function (req, res, next) {
    ziploc.given(request, req)
      .resolve(response, function (error, value) {
        if (error) {
          return next(error);
        }

        res.status(code).json(value);
      });
  };
};

function ExpressStatusLocation(ziploc, request, code, where) {
  this.ziploc = ziploc;
  this.request = request;
  this.code = code;
  this.where = where;
}

ExpressStatusLocation.prototype.json = function (response) {
  var ziploc = this.ziploc;
  var request = this.request;
  var code = this.code;

  var type = {
    location: this.where,
    json: response
  };

  return function (req, res, next) {
    ziploc
      .given(request, req)
      .resolve(type, function (error, value) {
        if (error) {
          return next(error);
        }

        res.status(code).location(value.location).json(value.json);
      });
  };
};
