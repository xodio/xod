import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { drillDown } from '../actions';
import { getRenerableBreadcrumbChunks, getBreadcrumbActiveIndex } from '../../editor/selectors';

const Breadcrumbs = ({ chunks, activeIndex, actions }) => (
  <ul className="Breadcrumbs Breadcrumbs--debugger">
    {chunks.map((chunk, i) => {
      const cls = classNames('Breadcrumbs-chunk-button', {
        'is-active': (i === activeIndex),
        'is-tail': (i > activeIndex),
      });
      return (
        <li key={chunk.nodeId}>
          <button
            className={cls}
            onClick={() => actions.drillDown(chunk.patchPath, chunk.nodeId)}
          >
            {chunk.label}
          </button>
        </li>
      );
    })}
  </ul>
);

Breadcrumbs.propTypes = {
  chunks: PropTypes.arrayOf(PropTypes.object),
  activeIndex: PropTypes.number,
  actions: PropTypes.objectOf(PropTypes.func),
};

const mapStateToProps = R.applySpec({
  chunks: getRenerableBreadcrumbChunks,
  activeIndex: getBreadcrumbActiveIndex,
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    drillDown,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Breadcrumbs);
