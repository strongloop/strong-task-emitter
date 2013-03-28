var TaskEmitter = require('../');

describe('TaskEmitter', function(){
  var taskEmitter;
  
  beforeEach(function(){
    taskEmitter = new TaskEmitter;
  });
  
  describe('.myMethod', function(){
    // example sync test
    it('should <description of behavior>', function() {
      taskEmitter.myMethod();
    });
    
    // example async test
    it('should <description of behavior>', function(done) {
      setTimeout(function () {
        taskEmitter.myMethod();
        done();
      }, 0);
    });
  });
});