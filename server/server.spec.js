import {TestServer} from './mode/server.test.js';
import {testConfig} from './config/test.config.js';
import {GenericEngine} from './engine/engine.generic.js';
import tcpPortUsed from 'tcp-port-used';

describe('Development server', function() {

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

  it('should instantiate engine after creating', function(done) {
    expect(server.engine() instanceof GenericEngine).toBe(true);
    done();
  });

  it('should listen to port specified in config', function(done) {
    tcpPortUsed.check(testConfig.server.port, testConfig.server.host)
      .then(function(inUse) {
        expect(inUse).toBe(false);
        done();
      }, function() {
        expect(true).toBe(false);
        done();
      });
  });

});
