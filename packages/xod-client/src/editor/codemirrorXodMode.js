import CodeMirror from 'codemirror';
import 'codemirror/addon/mode/simple';
import 'codemirror/addon/mode/overlay';
import 'codemirror/mode/clike/clike';

import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/trailingspace';
import 'codemirror/addon/comment/comment';

import { getTokens } from 'xod-arduino';

(() => {
  let xodOverlay;
  CodeMirror.defineMode('xodCpp', (config, parserConfig) => {
    xodOverlay = CodeMirror.simpleMode(config, {
      mode: { spec: CodeMirror.modes.clike },
      start: getTokens().concat(
        [
          { regex: /\/\/.*/, token: 'comment' },
          { regex: /\/\*/, token: 'comment', next: 'comment' },
        ]
      ),
      comment: [
        { regex: /.*?\*\//, token: 'comment', next: 'start' },
        { regex: /.*/, token: 'comment' },
      ],
    });
    return CodeMirror.overlayMode(
      CodeMirror.getMode(config, parserConfig.backdrop || 'text/x-c++src'),
      xodOverlay
    );
  });
  CodeMirror.defineMIME('text/x-c++xod', 'xodCpp');

  const maybeClearLines = (cm, event) => {
    if (event.keyCode !== 13) return;
    const cursor = cm.getCursor();
    if (cursor.line <= 0) return;

    for (
      let ln = cursor.line;
      !/\S/.test(cm.getLine(ln));
      ln-- // eslint-disable-line no-plusplus
    ) {
      cm.replaceRange(
        '',
        new CodeMirror.Pos(ln, 0),
        new CodeMirror.Pos(ln, cm.getLine(ln).length)
      );
    }
  };

  CodeMirror.defineOption('autoClearEmptyLines', false, (cm, value) => {
    /* eslint-disable no-param-reassign */
    if (value && !cm.state.clearEmptyLines) {
      cm.state.clearEmptyLines = { prev: cm.getCursor() };
      cm.on('keydown', maybeClearLines);
    } else if (!value && cm.state.clearEmptyLines) {
      cm.off('keydown', maybeClearLines);
      cm.state.clearEmptyLines = null;
    }
    /* eslint-enable no-param-reassign */
  });
})();
