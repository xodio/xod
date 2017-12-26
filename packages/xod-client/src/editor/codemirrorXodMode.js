import CodeMirror from 'codemirror';
import 'codemirror/addon/mode/simple';
import 'codemirror/addon/mode/overlay';
import 'codemirror/mode/clike/clike';

import { getTokens } from 'xod-arduino';

(() => {
  let xodOverlay;
  CodeMirror.defineMode('xodCpp', (config, parserConfig) => {
    xodOverlay = CodeMirror.simpleMode(config, {
      mode: { spec: CodeMirror.modes.clike },
      start: getTokens(),
    });
    return CodeMirror.overlayMode(
      CodeMirror.getMode(config, parserConfig.backdrop || 'text/x-c++src'),
      xodOverlay
    );
  });
  CodeMirror.defineMIME('text/x-c++xod', 'xodCpp');
})();
