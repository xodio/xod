import {Component} from '@angular/core';
import {EditorPage} from './components/editor/editor.page.ts';

@Component({
    selector: 'xod',
    template: '<editor></editor>',
    directives: [EditorPage],
    styles: [require('./app.styl')]
})
export class AppComponent {
}
