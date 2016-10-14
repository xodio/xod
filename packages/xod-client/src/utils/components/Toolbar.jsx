import R from 'ramda';
import React from 'react';
import CreateNodeWidget from '../../editor/components/CreateNodeWidget';
import UserPanel from '../../user/containers/UserPanel';

const Toolbar = ({
  meta,
  buttons,
  nodeTypes,
  selectedNodeType,
  onSelectNodeType,
  onAddNodeClick,
}) => {
  const buttonElements = () => {
    if (!Array.isArray(buttons)) {
      return null;
    }

    return R.map(
      (button) => {
        if (React.isValidElement(button)) {
          return button;
        }

        return (
          <button
            key={button.key}
            className={button.className}
            onClick={button.onClick}
          >
            {button.label}
          </button>
        );
      }
    )(buttons);
  };

  return (
    <div className="Toolbar">
      <CreateNodeWidget
        nodeTypes={nodeTypes}
        selectedNodeType={selectedNodeType}
        onNodeTypeChange={onSelectNodeType}
        onAddNodeClick={onAddNodeClick}
      />

      <div className="logo">
        XOD
      </div>

      <div className="project-meta">
        <span>
          {meta.name}
        </span>
        <span>
          {(meta.author) ? ` by ${meta.author}` : ''}
        </span>
      </div>

      <UserPanel />

      {buttonElements()}
    </div>
  );
};

Toolbar.propTypes = {
  meta: React.PropTypes.object,
  nodeTypes: React.PropTypes.object,
  selectedNodeType: React.PropTypes.number,
  onSelectNodeType: React.PropTypes.func,
  onAddNodeClick: React.PropTypes.func,
  buttons: React.PropTypes.arrayOf(
    React.PropTypes.shape({
      key: React.PropTypes.string,
      className: React.PropTypes.string,
      onClick: React.PropTypes.func,
      label: React.PropTypes.string,
    })
  ),
};

export default Toolbar;
