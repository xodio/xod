import React from 'react';
import PropTypes from 'prop-types';
import Icon from 'react-fa';
import * as XP from 'xod-project';

import sanctuaryPropType from '../../utils/sanctuaryPropType';
import PopupForm from '../../utils/components/PopupForm';
import { HOSTNAME } from '../../utils/urls';
import Button from '../../core/components/Button';

const PopupPublishProject = ({
  isVisible,
  isPublishing,
  project,
  user,
  onPublish,
  onRequestToEditPreferences,
  onClose,
}) => {
  const projectName = XP.getProjectName(project);
  const version = XP.getProjectVersion(project);
  const description = XP.getProjectDescription(project);
  const license = XP.getProjectLicense(project);

  // When popup is hidden, `user` could be Nothing
  const { username } = user.getOrElse({});

  return (
    <PopupForm
      className="PopupPublishProject"
      isVisible={isVisible}
      isClosable={!isPublishing}
      title={`You are about to publish on ${HOSTNAME}`}
      onClose={onClose}
    >
      <p className="property">
        <span className="propertyLabel">Name: </span>
        <span className="libName">{username}/{projectName}</span>
      </p>
      <p className="property">
        <span className="propertyLabel">Version: </span>
        {version}
      </p>
      <p className="property">
        <span className="propertyLabel">License: </span>
        {license}
      </p>
      <p className="property">
        <span className="propertyLabel">Description: </span>
        {description}
      </p>
      {isPublishing ? (
        <div className="ModalFooter">
          <Icon name="circle-o-notch" spin size="lg" /> Publishing…
        </div>
      ) : (
        <div className="ModalFooter">
          <Button onClick={onPublish} autoFocus>Publish</Button>
          <Button onClick={onRequestToEditPreferences}>Edit</Button>
          <Button onClick={onClose}>Cancel</Button>
        </div>
      )}
    </PopupForm>
  );
};

PopupPublishProject.propTypes = {
  isVisible: PropTypes.bool,
  isPublishing: PropTypes.bool,
  user: PropTypes.object,
  project: sanctuaryPropType(XP.Project),
  onPublish: PropTypes.func,
  onRequestToEditPreferences: PropTypes.func,
  onClose: PropTypes.func,
};

PopupPublishProject.defaultProps = {
  isVisible: false,
};

export default PopupPublishProject;
