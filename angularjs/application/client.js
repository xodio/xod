import {Component} from '@angular/core';

Component({
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
