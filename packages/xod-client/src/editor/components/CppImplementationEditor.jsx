import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import CodeMirror from 'react-codemirror';
import 'codemirror/mode/clike/clike';

const CppImplementationEditor = ({ isActive, source, isInDebuggerTab, onChange, onClose }) => {
  const options = {
    lineNumbers: true,
    readOnly: isInDebuggerTab,
    mode: 'text/x-c++src',
    theme: 'material',
  };

  return (
    <div
      className={cn('CppImplementationEditor', {
        isActive,
        isInDebuggerTab,
      })}
    >
      <div className="toolbar">
        <button className="back-button" onClick={onClose}>
          <i className="fa fa-arrow-left" />&nbsp;Back
        </button>
        <span className="title">{isInDebuggerTab ? 'Viewing' : 'Editing'} node C++ implementation</span>
      </div>
      <CodeMirror
        value={source}
        onChange={onChange}
        options={options}
      />
    </div>
  );
};

CppImplementationEditor.propTypes = {
  isActive: PropTypes.bool.isRequired,
  source: PropTypes.string.isRequired,
  isInDebuggerTab: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CppImplementationEditor;
