import * as R from 'ramda';
import React from 'react';
import { Maybe } from 'ramda-fantasy';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Patch as PatchType } from 'xod-project';
import { $Maybe } from 'xod-func-tools';

import * as Actions from '../actions';
import { isHelpboxVisible, getFocusedArea } from '../selectors';
import { getPatchForHelpbox } from '../../core/selectors';
import PatchDocs from '../components/PatchDocs';
import sanctuaryPropType from '../../utils/sanctuaryPropType';

import PointingPopup from '../components/PointingPopup';

import { FOCUS_AREAS } from '../constants';

const getSelectorByFocusedArea = focusedArea => {
  switch (focusedArea) {
    case FOCUS_AREAS.PROJECT_BROWSER:
      return '.PatchGroupItem.isSelected';
    case FOCUS_AREAS.NODE_SUGGESTER:
      return '.Suggester-item.is-highlighted';
    default:
      return null;
  }
};

class Helpbox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      focusedArea: props.focusedArea,
      selector: getSelectorByFocusedArea(props.focusedArea),
    };
  }
  componentDidUpdate() {
    if (this.props.focusedArea !== this.state.focusedArea) {
      const { focusedArea } = this.props;
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({
        focusedArea,
        selector: getSelectorByFocusedArea(focusedArea),
      });
    }
  }
  render() {
    const { maybeSelectedPatch, isVisible, actions } = this.props;
    if (!isVisible) return null;

    const docs = maybeSelectedPatch
      .map(patch => <PatchDocs patch={patch} />)
      .getOrElse(null);

    if (!this.state.selector) return null;

    return (
      <PointingPopup
        className="Helpbox"
        selectorPointingAt={this.state.selector}
        isVisible={isVisible && Maybe.isJust(maybeSelectedPatch)}
        hidePopup={actions.hideHelpbox}
      >
        {docs}
      </PointingPopup>
    );
  }
}

Helpbox.propTypes = {
  maybeSelectedPatch: sanctuaryPropType($Maybe(PatchType)),
  isVisible: PropTypes.bool,
  focusedArea: PropTypes.oneOf(R.values(FOCUS_AREAS)),
  actions: PropTypes.shape({
    // eslint-disable-next-line react/no-unused-prop-types
    hideHelpbox: PropTypes.func.isRequired,
  }),
};

const mapStateToProps = R.applySpec({
  isVisible: isHelpboxVisible,
  maybeSelectedPatch: getPatchForHelpbox,
  focusedArea: getFocusedArea,
});
const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(
    {
      hideHelpbox: Actions.hideHelpbox,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(Helpbox);
