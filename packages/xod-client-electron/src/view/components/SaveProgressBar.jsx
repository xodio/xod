import React from 'react';
import clx from 'classnames';

export const SaveProgressBar = ({ percentage }) => {
  const style = { width: `${Math.round(+ percentage * 100)}%` };

  const classNames = clx('SaveProgressBar', {
    'is-hidden': (percentage === 0),
  });

  return (
    <div className={classNames}>
      <div
        className="SaveProgressBar__progressBar"
        style={style}
      />
    </div>
  );
};

SaveProgressBar.propTypes = {
  percentage: React.PropTypes.number,
};

SaveProgressBar.defaultProps = {
  percentage: 0,
};

export default SaveProgressBar;
