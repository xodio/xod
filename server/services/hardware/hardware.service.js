import {GenericService} from '../service.generic';

export class Hardware extends GenericService {
  constructor(config) {
    super(config);
  }
}

Hardware.mode = 'hardware';