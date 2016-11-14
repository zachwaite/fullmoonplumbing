var Plumber = require('../dist/domain/Plumber').default;
var CreatePlumber = require('../dist/commands/CreatePlumber').default;
var UpdatePlumber = require('../dist/commands/UpdatePlumber').default;

var PlumberHired = require('../dist/events/PlumberHired').default;
var PlumberUpdated = require('../dist/events/PlumberUpdated').default;
var RateChanged = require('../dist/events/RateChanged').default;

// Only if rate and overtime rate are not null:
var PlumberIsAvailable = require('../dist/events/PlumberIsAvailable').default;
var PlumberIsUnavailable = require('../dist/events/PlumberIsUnavailable').default;

module.exports = {
  'Test Create Plumber': function (test) {
    var plumber = new Plumber();
    var result = plumber.execute(new CreatePlumber("134564","Mike", "Edmunds", null, null));
    test.ok(result.length == 1)
    test.ok(result[0] instanceof PlumberHired);
    test.equal(result[0].plumberId, "134564");
    test.equal(result[0].firstName, "Mike");
    test.equal(result[0].lastName, "Edmunds");
    test.done();
  },
  'Test Create Plumber available for scheduling immediately': function (test) {
    var plumber = new Plumber();
    var result = plumber.execute(new CreatePlumber("134564","Mike", "Edmunds", 80.0, 100.0));
    test.ok(result.length == 2)
    test.ok(result[0] instanceof PlumberHired);
    test.equal(result[0].plumberId, "134564");
    test.equal(result[0].firstName, "Mike");
    test.equal(result[0].lastName, "Edmunds");

    test.ok(result[1] instanceof PlumberIsAvailable);
    test.equal(result[1].regularRate, 80.0);
    test.equal(result[1].overtimeRate, 100.0);
    
    test.done();
  },
  'Test Create Plumber with negative rate': function (test) {
    var plumber = new Plumber();
    var result = plumber.execute(new CreatePlumber("134564","Mike", "Edmunds", -5, 100.0));
    test.ok(result.length == 1)
    test.ok(result[0] instanceof PlumberHired);
    test.done();
  },  
  'Test Create Plumber with negative overtime rate': function (test) {
    var plumber = new Plumber();
    var result = plumber.execute(new CreatePlumber("134564","Mike", "Edmunds", 50.00, -100.0));
    test.ok(result.length == 1)
    test.ok(result[0] instanceof PlumberHired);
    test.done();
  },  
  'Test Create Plumber mandatory firstname': function (test) {
    var plumber = new Plumber();
    test.throws( function() { plumber.execute(new CreatePlumber("134564",null, "Smith", 80.0, 100.0)), PlumberRequiredFieldError } ); 
    test.done();
  },
  'Test Create Plumber mandatory lastName': function (test) {
    var plumber = new Plumber();
    test.throws( function() { plumber.execute(new CreatePlumber("134564","Joe", null, 80.0, 100.0)), PlumberRequiredFieldError } ); 
    test.done();
  },
  'Test Update Plumber - PlumberUpdate event happens upon firstname change.': function (test) {
    // Given:
    var plumber = new Plumber();
    var previousEvents = plumber.execute(new CreatePlumber("134564","Mike", "Edmunds", 80.0, 100.0));
    var updatedPlumber = new Plumber();
    for (var index = 0; index < previousEvents.length; ++index) {
      var evt = previousEvents[index];
      updatedPlumber.hydrate(evt);
    }

    // When:
    var result = updatedPlumber.execute(new UpdatePlumber("134564","Joe", "Edmunds", 80.0, 100.0));

    //Then:
    test.ok(result[0] instanceof PlumberUpdated)    
    test.equal(result[0].firstName, "Joe");
    test.equal(result[0].lastName, "Edmunds");    test.done();
  },  
  'Test Update Plumber - PlumberUpdate event happens upon lastname change.': function (test) {
    // Given:
    var plumber = new Plumber();
    var previousEvents = plumber.execute(new CreatePlumber("134564","Mike", "Edmunds", 80.0, 100.0));
    var updatedPlumber = new Plumber();
    for (var index = 0; index < previousEvents.length; ++index) {
      var evt = previousEvents[index];   
      updatedPlumber.hydrate(evt);
    }
    // When:
    var result = updatedPlumber.execute(new UpdatePlumber("134564","Mike", "Edmundson", 80.0, 100.0));

    //Then:
    test.ok(result[0] instanceof PlumberUpdated)    
    test.equal(result[0].firstName, "Mike");
    test.equal(result[0].lastName, "Edmundson");    
    test.done();
  },  
  'Test Update Plumber - No RateChanged event if rates remained the same..': function (test) {
    // Given:
    var plumber = new Plumber();
    var previousEvents = plumber.execute(new CreatePlumber("134564","Mike", "Edmunds", 80.0, 100.0));
    var updatedPlumber = new Plumber();
    for (var index = 0; index < previousEvents.length; ++index) {
      var evt = previousEvents[index];    
      updatedPlumber.hydrate(evt);
    }

    // When:
    var result = updatedPlumber.execute(new UpdatePlumber("134564","Mike", "Edmundson", 80.0, 100.0));

    //Then:
    test.ok(result[0] instanceof PlumberUpdated)    
    test.ok(result.length == 1)
    test.done();
  },  
  'Test Update Plumber - RateChanged event happens when regular rate changed...': function (test) {
    // Given:
    var plumber = new Plumber();
    var previousEvents = plumber.execute(new CreatePlumber("134564","Mike", "Edmunds", 80.0, 100.0));
    var updatedPlumber = new Plumber();
    for (var index = 0; index < previousEvents.length; ++index) {
      var evt = previousEvents[index];    
      updatedPlumber.hydrate(evt);
    }

    // When:
    var result = updatedPlumber.execute(new UpdatePlumber("134564","Mike", "Edmundson", 85.0, 100.0));

    //Then:
    test.ok(result.length == 2)
    test.ok(result[1] instanceof RateChanged)    
    test.equal(result[1].regularRate, 85.0)
    test.equal(result[1].overtimeRate, 100.0)
    test.done();
  },   
  'Test Update Plumber - RateChanged event happens when overtime rate changed...': function (test) {
    // Given:
    var plumber = new Plumber();
    var previousEvents = plumber.execute(new CreatePlumber("134564","Mike", "Edmunds", 80.0, 100.0));
    var updatedPlumber = new Plumber();
    for (var index = 0; index < previousEvents.length; ++index) {
      var evt = previousEvents[index];    
      updatedPlumber.hydrate(evt);
    }

    // When:
    var result = updatedPlumber.execute(new UpdatePlumber("134564","Mike", "Edmundson", 80.0, 120.0));

    //Then:
    test.ok(result.length == 2)
    test.ok(result[1] instanceof RateChanged)    
    test.equal(result[1].regularRate, 80.0)
    test.equal(result[1].overtimeRate, 120.0)
    test.done();
  },      
  'Test Update Plumber mandatory firstname': function (test) {
    var plumber = new Plumber();
    test.throws( function() { plumber.execute(new UpdatePlumber("134564",null, "Smith", 80.0, 100.0)), PlumberRequiredFieldError } ); 
    test.done();
  },
  'Test Update Plumber mandatory lastName': function (test) {
    var plumber = new Plumber();
    test.throws( function() { plumber.execute(new UpdatePlumber("134564","Joe", null, 80.0, 100.0)), PlumberRequiredFieldError } ); 
    test.done();
  },
  'Test Updating plumber with zero rate makes plumber unavailable for scheduling because we dont work for free': function (test) {
    // Given:
    var plumber = new Plumber();
    var previousEvents = plumber.execute(new CreatePlumber("134564","Mike", "Edmunds", 80.0, 100.0));
    var updatedPlumber = new Plumber();
    for (var index = 0; index < previousEvents.length; ++index) {
      var evt = previousEvents[index];    
      updatedPlumber.hydrate(evt);
    }

    // When:
    var result = updatedPlumber.execute(new UpdatePlumber("134564","Mike", "Edmunds", 0.0, 0.0));

    //Then:
    test.ok(result.length == 3)
    test.ok(result[2] instanceof PlumberIsUnavailable);    
    test.equal(result[2].plumberId, "134564");
    test.equal(result[2].reason, "Missing rate.")
    test.done();
  }      
};
