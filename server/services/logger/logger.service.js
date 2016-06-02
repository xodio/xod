import {GenericService} from '../service.generic';

export class Logger extends GenericService {
  constructor(config) {
    super(config);
  }
}

Logger.mode = 'logger';
