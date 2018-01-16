import * as R from 'ramda';
import CodeMirror from 'codemirror';
import 'codemirror/addon/mode/simple';
import 'codemirror/addon/mode/overlay';
import 'codemirror/mode/clike/clike';

import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/trailingspace';
import 'codemirror/addon/comment/comment';
import 'codemirror/addon/scroll/simplescrollbars';

/* eslint-disable max-len */
const XOD_TYPE_NAMES = /(Number|NodeId|Context|DirtyFlags|TimeMs|u?int\d{1,2}_t|size_t|XString|State|List|Iterator)\b/gm;
const XOD_BUILTIN_NAMES = /(getValue|emitValue|isInputDirty|transactionTime|setTimeout|clearTimeout|isTimedOut|evaluate|getState)\b/gm;
const ARDUINO_BUILTIN_NAMES = /((digital|analog)(Read|Write)|pinMode|analogReference)\b/gm;
const XOD_TAG_NAMES = /(((input|output)_[A-Za-z0-9_]+)|GENERATED_CODE)\b/gm;
/* eslint-enable max-len */

// Function that creates a new RegExp to prevent highlighting
// a variable part that matches with things above.
// E.G. `myNumber`, `newState`, `agetValue` and etc
// :: [RegExp] -> RegExp
const createCMHack = R.compose(
  r => new RegExp(`[A-Za-z0-9_]+(${r})`, 'gm'),
  R.join('|'),
  R.map(R.compose(
    R.replace('\\b', ''),
    R.prop('source')
  ))
);

(() => {
  let xodOverlay;
  CodeMirror.defineMode('xodCpp', (config, parserConfig) => {
    xodOverlay = CodeMirror.simpleMode(config, {
      mode: { spec: CodeMirror.modes.clike },
      start: [
        {
          regex: XOD_TAG_NAMES,
          token: 'tag',
        },
        {
          regex: XOD_TYPE_NAMES,
          token: 'type',
        },
        {
          regex: XOD_BUILTIN_NAMES,
          token: 'builtin',
        },
        {
          regex: ARDUINO_BUILTIN_NAMES,
          token: 'builtin',
        },
        {
          regex: createCMHack([
            XOD_TYPE_NAMES,
            XOD_BUILTIN_NAMES,
            ARDUINO_BUILTIN_NAMES,
            XOD_TAG_NAMES,
          ]),
          token: 'variable',
        },
        { regex: /\/\/.*/, token: 'comment' },
        { regex: /\/\*/, token: 'comment', next: 'comment' },
      ],
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
