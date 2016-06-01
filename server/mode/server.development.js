import {GenericServer} from './server.generic';
import {ExpressEngine} from '../engine/engine.express';

export class DevelopmentServer extends GenericServer {
  constructor(config) {
    super(config, new ExpressEngine(config));
  }
}

DevelopmentServer.name = 'development';
