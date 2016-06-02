import {TestServer} from './mode/server.test';
import {testConfig} from './config/test.config';
import {developmentConfig} from './config/development.config';
import {GenericEngine} from './engine/engine.generic';
import tcpPortUsed from 'tcp-port-used';
import {DevelopmentServer} from './mode/server.development';
import {Services} from './services/services';

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
