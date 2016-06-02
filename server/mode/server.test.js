import {GenericServer} from './server.generic';
import {ExpressEngine} from '../engine/engine.express';

export class TestServer extends GenericServer {
  constructor(config) {
    super(config, new ExpressEngine(config));
  }
}

TestServer.configName = 'test';
