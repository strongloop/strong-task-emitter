# task-emitter
v0.0.1

## Install

    slnode install task-emitter

## Purpose

Perform complex parallel operations recursively (such as walking a directory tree or making recursive http requests). Supports inheritence similarly to `EventEmitter` to allow classes to encapsulate recursive behavior while maintaining extensibility.
    
## Example

The following example shows the basic API for a TaskEmitter.

    var TaskEmitter = require('../');
    var request = require('request');
    var results = [];

    var te = new TaskEmitter();

    te
      .task('request', request, 'http://google.com')
      .task('request', request, 'http://yahoo.com')
      .task('request', request, 'http://apple.com')
      .task('request', request, 'http://youtube.com')
      .on('request', function (url, res, body) {
        results.push(Buffer.byteLength(body));
      })
      .on('progress', function (status) {
        console.log(((status.total - status.remaining) / status.total) * 100 + '%', 'complete');
      })
      .on('error', function (err) {
        console.log('error', err);
      })
      .on('done', function () {
        console.log('Total size of all homepages', results.reduce(function (a, b) {
          return a + b;
        }), 'bytes');
      });

The next example highlights how TaskEmitter can be used to simplify recursive asynchronous operations. The following code recursively walks a social network over HTTP. All requests run in parallel.

    var TaskEmitter = require('../');
    var request = require('request');
    var socialNetwork = [];

    var te = new TaskEmitter();

    te
      .task('friends', fetch, 'me')
      .on('friends', function (user, url) {
        if(url !== 'me') {
          socialNetwork.push(user);
        }
    
        user.friendIds.forEach(function (id) {
          this.task('friends', fetch, 'users/' + id)
        }.bind(this));
      })
      .on('done', function () {
        console.log('There are a total of %n people in my network', socialNetwork.length);
      });


    function fetch(url, fn) {
      request({
        url: 'http://my-api.com/' + url,
        json: true,
        method: 'GET'
      }, fn);
    }

## Extending TaskEmitter

`TaskEmitter` is designed to be a base class which can be inherited from and extended by many levels of sub classes. The following example shows a class that inherits from TaskEmitter and provides recursive directory walking and file loading.

    var TaskEmitter = require('../');
    var fs = require('fs');
    var path = require('path');
    var inherits = require('util').inherits;

    function Loader() {
      TaskEmitter.call(this);
  
      this.path = path;
      this.files = {};

      this.on('readdir', function (p, files) {
        files.forEach(function (f) {
          this.task(fs, 'stat', path);
        }.bind(this));
      });

      this.on('stat', function (file, stat) {
        if(stat.isDirectory()) {
          this.task(fs, 'readdir', file);
        } else {
          this.task(fs, 'readFile', file, path.extname(file) === '.txt' ? 'utf-8' : null);
        }
      });

      this.on('readFile', function (path, encoding, data) {
        this.files[path] = data;
      });
    }

    inherits(Loader, TaskEmitter);

    Loader.prototype.load = function (path, fn) {
      if(fn) {
        // error events are handled if a task callback ever is called
        // with a first argument that is not falsy
        this.on('error', fn);
    
        // once all tasks are complete the done event is emitted
        this.on('done', function () {
          fn(null, this.files);
        });
      }
  
      this.task(fs, 'readdir', path);
    }

    // usage
    var l = new Loader();
    
    l.load('sample-files', function (err, files) {
      console.log(err || files);
    });
    
## Events

### <taskName>
  
Emitted when the `<taskName>` has completed.
  
**Example:**

    var te = new TaskEmitter();

    te
      .task('foo', function(arg1, arg2, fn) {
        var err, result = 'foo';
    
        fn(err, result);
      })
      .on('error', ...)
      .on('foo', function(arg1, arg2, result) {
        // ...
      });

### done

Emitted when all tasks are complete.

### error

Emitted when any error occurs during the running of a `task()`. If this event is not handled an error will be thrown.

### progress

Emitted after a task has been completed.

**Example:**

    te.on('progress', function(status) {
      console.log(status);
    });
    
**Output:**

    {
      remaining: 4,
      total: 8,
      task: 'foo'
    }
