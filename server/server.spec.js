const TestServer = require('./mode/server.test');
const testConfig = require('./config/test.config');
const developmentConfig = require('./config/development.config');
const GenericEngine = require('./engine/engine.generic');
const tcpPortUsed = require('tcp-port-used');
const DevelopmentServer = require('./mode/server.development');
const Services = require('./services/services');

describe('Test server', function() {

  let server = null;

  beforeEach(function(done) {
    server = new TestServer(testConfig);
    server.launch()
      .then(() => {
        done();
      });
  });

  afterEach(function(done) {
    server.stop()
      .then(() => {
        done();
      });
  });

  it('should instantiate engine at least after launching', function(done) {
    expect(server.engine() instanceof GenericEngine).toBe(true);
    done();
  });

  it('should listen to port specified in config after launching', function(done) {
    tcpPortUsed.check(testConfig.server.port, testConfig.server.host)
      .then(function(inUse) {
        expect(inUse).toBe(true);
        done();
      }, function() {
        expect(true).toBe(false);
        done();
      });
  });

});

describe('Development server', function() {

  let server = null;

  beforeEach(function(done) {
    server = new DevelopmentServer(developmentConfig);
    server.launch()
    .then(() => {
      done();
    });
  });

  afterEach(function(done) {
    server.stop()
    .then(() => {
      done();
    });
  });

  it('should instantiate engine at least after launching', function(done) {
    expect(server.engine() instanceof GenericEngine).toBe(true);
    done();
  });

  it('should listen to port specified in config after launching', function(done) {
    tcpPortUsed.check(developmentConfig.server.port, developmentConfig.server.host)
    .then(function(inUse) {
      expect(inUse).toBe(true);
      done();
    }, function() {
      expect(true).toBe(false);
      done();
    });
  });

  it('should launch all services listed in development server mode config', function(done) {
    server
    .engine()
    .services()
    .status()
    .then(servicesStatus => {
      expect(servicesStatus === Services.STATUS.VALID).toBe(true);
      done();
    });
  });
});
