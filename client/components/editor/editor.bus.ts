import {EventEmitter, Injectable} from '@angular/core';

export class EditorMessage {
  constructor(public tag: string, public body: any) {
  }
}

@Injectable()
export class EditorBus {
  private listeners = new Map<string, Array<(message: EditorMessage) => void>>();

  constructor() {
  }

  listen(tag: string, listener: (message: EditorMessage) => void) {
    const listeners = this.listeners.get(tag);
    if (listeners) {
      this.listeners.set(tag, listeners.concat([listener]));
    } else {
      this.listeners.set(tag, [listener]);
    }
  }

  send(message: EditorMessage) {
    const listeners = this.listeners.get(message.tag);
    if (listeners) {
      for (let index in Object.keys(listeners)) {
        listeners[index](message);
      }
    }
  }
}
