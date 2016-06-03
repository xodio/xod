require('babel-polyfill');
require('./shim');
import { bootstrap } from '@angular/platform-browser-dynamic';

import {Component} from '@angular/core';

@Component({
  selector: 'xod',
  template: '<div>Hello my name is {{name}}. <button (click)="sayMyName()">Say my name</button></div>'
})
class Xod {
  constructor() {
    this.name = 'Max';
  }
  sayMyName() {
    console.log('My name is', this.name);
  }
}

alert(34132);