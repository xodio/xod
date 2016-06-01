import {GenericServer} from './server.generic';
import {ExpressEngine} from '../engine/engine.express';

export class TestServer extends GenericServer {
  constructor(config) {
    super(config, new ExpressEngine(config));
  }

  launch() {
    return this.engine().launch();
  }

  stop() {
    return this.engine().stop();
  }
}

TestServer.configName = 'test';
