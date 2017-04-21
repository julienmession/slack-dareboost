// See https://github.com/angular/protractor/blob/master/docs/referenceConf.js for reference
exports.config = {
  // Attach to Selenium server running within the container
  seleniumAddress: 'http://localhost:4444/wd/hub',
  
  // Use Jasmine 2.x
  framework : 'jasmine2',
  specs: [
    'specs/*/*-spec.js'
  ],
  
  // Chrome is not allowed to create a SUID sandbox when running inside Docker  
  capabilities: {
    'browserName': 'chrome',
    'chromeOptions': {
      'args': ['no-sandbox']
    }
  },

  // Generate JUnit-compatible test report that can be picked up by Jenkins or similar tools  
  onPrepare: function() {
    var JUnitXmlReporter = require('jasmine-reporters').JUnitXmlReporter;
    jasmine.getEnv().addReporter(new JUnitXmlReporter({
      // See https://github.com/larrymyers/jasmine-reporters/blob/master/src/junit_reporter.js#L56 for more options
      savePath : 'target'
    }));
  }
};
