import React from 'react';
import clx from 'classnames';

export const SaveProgressBar = ({ progress }) => {
  const style = { width: `${Math.round(+progress * 100)}%` };

  const classNames = clx('SaveProgressBar', {
    'is-hidden': (progress === 0),
  });

  return (
    <div className={classNames}>
      <div
        className="bar"
        style={style}
      />
    </div>
  );
};

SaveProgressBar.propTypes = {
  progress: React.PropTypes.number,
};

SaveProgressBar.defaultProps = {
  progress: 0,
};

export default SaveProgressBar;
