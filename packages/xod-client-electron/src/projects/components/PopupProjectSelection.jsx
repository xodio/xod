import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'react-fa';
import { PopupForm } from 'xod-client';
import clx from 'classnames';
import { REDUCER_STATUS, PROJECT_STATUS } from '../constants';

const PopupProjectSelection = ({
  projects,
  isVisible,
  onSelect,
  onClose,
  onSwitchWorkspace,
  onCreateNewProject,
}) => {
  const onProjectSelect = meta => () => onSelect(meta);

  const renderProjectElement = el => {
    if (el.status === PROJECT_STATUS.ERROR) {
      return (
        <li className="error" key={el.path}>
          <div>
            <p className="path">
              <span>Path:</span>
              {el.path}
            </p>
            <p className="message">{el.message}</p>
          </div>
        </li>
      );
    }

    return (
      <li className="project" key={el.path}>
        <button onClick={onProjectSelect(el)}>
          <p className="name">
            {el.content.name} <span>by {el.content.authors}</span>
          </p>
          <p className="path">
            <span>Path:</span>
            {el.path}
          </p>
        </button>
      </li>
    );
  };

  const renderContent = () => {
    if (projects.status === REDUCER_STATUS.LOADED) {
      const listClassName = clx('ProjectList', {
        scroll: projects.list.length > 5,
      });

      return (
        <div>
          <div className="ModalContent">
            <ul className={listClassName}>
              {projects.list.map(renderProjectElement)}
            </ul>
          </div>
          <div className="ModalFooter">
            <button onClick={onSwitchWorkspace} className="Button">
              Switch workspace
            </button>
            <button onClick={onCreateNewProject} className="Button">
              Create new project
            </button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <Icon name="spinner" size="3x" spin />
        <p>Project list is loading. Please wait...</p>
      </div>
    );
  };

  return (
    <PopupForm
      title="Choose project to open:"
      className="PopupProjectSelection"
      onClose={onClose}
      isVisible={isVisible}
    >
      {renderContent()}
    </PopupForm>
  );
};

PopupProjectSelection.propTypes = {
  projects: PropTypes.object,
  isVisible: PropTypes.bool,
  onSelect: PropTypes.func,
  onClose: PropTypes.func,
  onSwitchWorkspace: PropTypes.func,
  onCreateNewProject: PropTypes.func,
};

PopupProjectSelection.defaultProps = {
  isVisible: false,
};

export default PopupProjectSelection;
