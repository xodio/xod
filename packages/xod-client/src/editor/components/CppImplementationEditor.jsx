import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import ReactCodeMirror from 'react-codemirror';
import '../codemirrorXodMode';

// See comments below
let codeMirror = null;
let refreshed = false;

const CppImplementationEditor = ({
  patchPath,
  isActive,
  source,
  isInDebuggerTab,
  onChange,
  onClose,
}) => {
  const options = {
    lineNumbers: true,
    readOnly: isInDebuggerTab,
    mode: 'text/x-c++xod',
    theme: 'xod',
    indentUnit: 4,
    extraKeys: {
      Tab: CM => {
        if (CM.somethingSelected()) {
          const sel = CM.getSelection('\n');
          // Indent only if there are multiple lines selected, or if the selection spans a full line
          if (
            sel.length > 0 &&
            (sel.indexOf('\n') > -1 ||
              sel.length === CM.getLine(CM.getCursor().line).length)
          ) {
            CM.indentSelection('add');
            return;
          }
        }

        if (CM.options.indentWithTabs) {
          CM.execCommand('insertTab');
        } else {
          CM.execCommand('insertSoftTab');
        }
      },
      'Shift-Tab': CM => CM.indentSelection('subtract'),
      'Ctrl-/': 'toggleComment',
      'Cmd-/': 'toggleComment',
    },
    showTrailingSpace: true,
    autoCloseBrackets: true,
    autoClearEmptyLines: true,
    scrollbarStyle: 'overlay',
  };

  if (codeMirror && !refreshed) {
    // A necessary evil to correctly position the cursor
    // on the first run and not to wrap the entire component in a class
    codeMirror.getCodeMirror().refresh();
    refreshed = true;
  }

  return (
    <div
      className={cn('AttachmentEditor', {
        isActive,
        isInDebuggerTab,
      })}
    >
      <div className="Breadcrumbs Breadcrumbs--codeEditor">
        <ul>
          <li>
            <button className="back-button" onClick={onClose} />
          </li>
          <li>
            <button className="Breadcrumbs-chunk-button" onClick={onClose}>
              {patchPath}
            </button>
          </li>
          <li>
            <button className="Breadcrumbs-chunk-button is-tail is-active">
              C++ implementation
              {isInDebuggerTab && <span className="hint">read only</span>}
            </button>
          </li>
        </ul>
      </div>
      <div className="cpp-editor">
        <ReactCodeMirror
          value={source}
          onChange={onChange}
          options={options}
          ref={el => {
            codeMirror = codeMirror || el;
          }}
        />
      </div>
    </div>
  );
};

CppImplementationEditor.propTypes = {
  patchPath: PropTypes.string.isRequired,
  isActive: PropTypes.bool.isRequired,
  source: PropTypes.string.isRequired,
  isInDebuggerTab: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CppImplementationEditor;
