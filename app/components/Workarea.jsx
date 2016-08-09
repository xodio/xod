import React from 'react';

const Workarea = ({ children }) => (
  <div className="Workarea">
    {children}
  </div>
);

Workarea.propTypes = {
  children: React.PropTypes.element,
};

export default Workarea;
