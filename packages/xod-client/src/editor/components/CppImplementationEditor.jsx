import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import CodeMirror from 'react-codemirror';
import 'codemirror/mode/clike/clike';

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
    mode: 'text/x-c++src',
    theme: 'xod',
    indentUnit: 4,
  };

  return (
    <div
      className={cn('CppImplementationEditor', {
        isActive,
        isInDebuggerTab,
      })}
    >
      <ul className="Breadcrumbs Breadcrumbs--codeEditor">
        <li>
          <button className="back-button" onClick={onClose} />
        </li>
        <li>
          <button
            className="Breadcrumbs-chunk-button"
            onClick={onClose}
          >
            {patchPath}
          </button>
        </li>
        <li>
          <button
            className="Breadcrumbs-chunk-button is-tail is-active"
          >
            C++ implementation
            {isInDebuggerTab && (
              <span className="hint">
                read only
              </span>
            )}
          </button>
        </li>
      </ul>
      <div className="editor">
        <CodeMirror
          value={source}
          onChange={onChange}
          options={options}
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
