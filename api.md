## Strong Task Emitter API

### taskEmitter.task()

Execute a task and emit an event when it is complete.

You must provide

  - A `scope` (eg. the fs module) and a name of a function on the scope (eg. `'readFile'`).

**Example**

    var fs = require('fs');
    var te = new TaskEmitter();

    te
      .task(fs, 'readFile')
      .on('readFile', ...);
  
or

  - Your task name (eg. 'my-task') and a function that executes the task and takes a conventional node callback (`fn(err, result)`).
  
**Example**

    var te = new TaskEmitter();

    te
      .task('my-task', myTask)
      .on('my-task', ...);
      
    function myTask(fn) {
      // an async task of some sort
      setTimeout(function() {
        // callback
        fn(null, 'my result');
      }, 1000);
    }
    
**Example**

It is safe to execute tasks in the event listener of another task as long as it is in the same tick.

    var te = new TaskEmitter();

    te
      .task(fs, 'stat', '/path/to/file-1')
      .task(fs, 'stat', '/path/to/file-2')
      .task(fs, 'stat', '/path/to/file-3')
      .on('stat', function(err, path, stat) {
        if(stat.isDirectory()) {
          // must add tasks before
          // this function returns
          this.task(fs, 'readdir', path);
        }
      })
      .on('readdir', function(path, files) {
        console.log(files); // path contents
      })
      .on('done', function() {
        console.log('finished!');
      });
    
### taskEmitter.remaining()

Determine how many tasks remain.

**Example**

    var te = new TaskEmitter();

    te
      .task(fs, 'stat', '/path/to/file-1')
      .task(fs, 'stat', '/path/to/file-2')
      .task(fs, 'stat', '/path/to/file-3')
      .on('stat', function(err, path, stat) {
        console.log('%s is a %s', stat.isDirectory() ? 'directory' : 'file');
      })
      .on('done', function() {
        console.log('finished!');
      });
      
    var remaining = te.remaining();
    
    console.log(remaining); // 3

### taskEmitter.stop()

Stop all remaining tasks.

### taskEmitter.reset()

Remove all tasks and listeners.
    
## Events

### &lt;taskName&gt;
  
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

**Example using the `fs` module**

    var te = new TaskEmitter();
    
    te
      .task(fs, 'stat', '/path/to/file-1')
      .task(fs, 'stat', '/path/to/file-2')
      .task(fs, 'stat', '/path/to/file-3')
      .on('stat', function(err, path, stat) {
        console.log('%s is a %s', stat.isDirectory() ? 'directory' : 'file');
      })
      .on('done', function() {
        console.log('finished!');
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
