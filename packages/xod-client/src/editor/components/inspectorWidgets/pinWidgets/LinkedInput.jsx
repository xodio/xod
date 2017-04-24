import React from 'react';

const LinkedInput = ({ id }) => (
  <input
    className="inspectorTextInput inspectorTextInput--linked"
    type="text"
    id={id}
    disabled
    value="linked"
  />
);

LinkedInput.displayName = 'LinkedInput';

LinkedInput.propTypes = {
  id: React.PropTypes.string.isRequired,
};

export default LinkedInput;
