import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Patch as PatchType } from 'xod-project';
import { $Maybe } from 'xod-func-tools';

import * as Actions from '../actions';
import { isHelpbarVisible } from '../selectors';
import { getPatchForHelpbar } from '../../core/selectors';
import PatchDocs from '../components/PatchDocs';
import sanctuaryPropType from '../../utils/sanctuaryPropType';


const Helpbar = ({ maybeSelectedPatch, isVisible, actions }) => {
  if (!isVisible) return null;

  const docs = maybeSelectedPatch
    .map(patch => <PatchDocs patch={patch} />)
    .getOrElse(
      <div className="no-selection">
        Select a node or patch to view its documentation article
      </div>
    );

  return (
    <div className="Helpbar">
      <a
        role="button"
        tabIndex="0"
        className="close-button"
        onClick={actions.toggleHelpbar}
      >
        &times;
      </a>
      {docs}
    </div>
  );
};

Helpbar.propTypes = {
  maybeSelectedPatch: sanctuaryPropType($Maybe(PatchType)),
  isVisible: PropTypes.bool,
  actions: PropTypes.shape({
    // eslint-disable-next-line react/no-unused-prop-types
    toggleHelpbar: PropTypes.func.isRequired,
  }),
};

const mapStateToProps = R.applySpec({
  isVisible: isHelpbarVisible,
  maybeSelectedPatch: getPatchForHelpbar,
});
const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    toggleHelpbar: Actions.toggleHelpbar,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Helpbar);
