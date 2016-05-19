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

var Ziploc = module.exports = function (contents) {
  this.contents = contents || [];
};

Ziploc.prototype.add = function (content) {
  return new Ziploc(this.contents.concat(content));
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
  return this.add({
    type: type,
    dependencies: [],
    resolve: function (done) {
      done(null, value);
    }
  });
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

  function once(error, value) {
    if (called) {
      return false;
    }

    called = true;
    done(error, value);
  }

  try {
    result = fn.apply(instance, args.concat(once));
  }
  catch (error) {
    return once(error);
  }

  if (result && typeof result.then === 'function') {
    return result.then(function (value) {
      once(null, value);
    }, once);
  }

  if (fn.length <= args.length) {
    return once(null, result);
  }
}

function canResolveExplicit(type) {
  return function (content) {
    return content.type === type;
  };
}

function score(content) {
  return Math.pow(10, content.dependencies.length) +
    content.dependencies
      .concat(content.type)
      .join('')
      .length;
}

function sort(contents, method) {
  contents.sort(method);
  return contents;
}

function ascending(a, b) {
  return score(a) - score(b);
}

function descending(a, b) {
  return score(b) - score(a);
}

function createExplicitResolver(contents) {
  return function (content) {
    return function (done) {
      resolveExplicit(contents, content, done);
    };
  };
}

function resolveExplicit(contents, content, done) {
  var tasks = content.dependencies
    .map(createTypeResolver(contents));

  series(tasks, function (error, args) {
    if (error) {
      return done(error);
    }

    invoke(content.resolve, content.instance, args, done);
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

function createImplicitResolver(contents, type) {
  return function (content) {
    return function (done) {
      resolveImplicit(contents, type, content, done);
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

function resolveImplicit(contents, type, content, done) {
  var template = getMatchForTemplate(type, content.type)[1];

  var tasks = content.dependencies
    .map(rename(template))
    .map(createTypeResolver(contents));

  series(tasks, function (error, args) {
    if (error) {
      return done(error);
    }

    args.unshift(new Template(template));
    invoke(content.resolve, content.instance, args, done);
  });
}

function createTypeResolver(contents) {
  return function (type) {
    return function (done) {
      resolveType(contents, type, done);
    };
  };
}

function resolveType(contents, type, done) {
  var explicit = sort(contents.filter(canResolveExplicit(type)), ascending)
    .map(createExplicitResolver(contents));

  var implicit = sort(contents.filter(canResolveImplicit(type)), descending)
    .map(createImplicitResolver(contents, type));

  var tasks = explicit.concat(implicit);

  if (tasks.length === 0) {
    return done(new TypeError(type));
  }

  first(tasks, done);
}

Ziploc.prototype.resolve = function (type, done) {
  resolveType(this.contents, type, done);
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
