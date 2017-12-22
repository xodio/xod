import R from 'ramda';
import React from 'react';
import { Maybe } from 'ramda-fantasy';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Patch as PatchType } from 'xod-project';
import { $Maybe } from 'xod-func-tools';
import cn from 'classnames';
import CustomScroll from 'react-custom-scroll';

import * as Actions from '../actions';
import { isHelpboxVisible, getFocusedArea } from '../selectors';
import { getPatchForHelpbox } from '../../core/selectors';
import PatchDocs from '../components/PatchDocs';
import sanctuaryPropType from '../../utils/sanctuaryPropType';
import CloseButton from '../../core/components/CloseButton';

import { UPDATE_HELPBOX_POSITION, FOCUS_AREAS } from '../constants';
import {
  triggerUpdateHelpboxPositionViaProjectBrowser,
  triggerUpdateHelpboxPositionViaSuggester,
} from '../utils';

class Helpbox extends React.Component {
  constructor(props) {
    super(props);

    this.helpboxRef = null;

    this.state = {
      isVisible: true,
      top: 0,
      left: 0,
      pointerTop: 0,
      height: 0,
    };

    this.updateRef = this.updateRef.bind(this);
    this.getHelpboxOffset = this.getHelpboxOffset.bind(this);
    this.getPointerOffset = this.getPointerOffset.bind(this);

    this.onUpdatePosition = this.onUpdatePosition.bind(this);
  }
  componentDidMount() {
    window.addEventListener(UPDATE_HELPBOX_POSITION, this.onUpdatePosition);
    this.triggerUpdatePosition();
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevState.isVisible && !this.state.isVisible) {
      this.props.actions.hideHelpbox();
      return;
    }
    if (prevState.height !== this.helpboxRef.clientHeight) {
      this.triggerUpdatePosition();
    }
  }
  componentWillUnmount() {
    window.removeEventListener(UPDATE_HELPBOX_POSITION, this.onUpdatePosition);
  }
  onUpdatePosition(event) {
    this.setState({
      isVisible: event.detail.isVisible,
    });

    const top = event.detail.top;
    // set `right` property to `left` constant, cause
    // `right` is a position of right side of target element,
    // so it will be left side of helpbox
    const left = event.detail.right;

    const windowHeight = window.innerHeight;
    const elHeight = this.helpboxRef.clientHeight;
    const isFitWindow = (top + elHeight < windowHeight);
    const newTop = isFitWindow ? top : windowHeight - elHeight;
    const newPointer = isFitWindow ? 0 : top - newTop;

    this.setState({
      left,
      top: newTop,
      pointerTop: newPointer,
      height: elHeight,
    });
  }
  getHelpboxOffset() {
    return { transform: `translate(${this.state.left}px, ${this.state.top}px)` };
  }
  getPointerOffset() {
    return { transform: `translateY(${this.state.pointerTop}px)` };
  }
  triggerUpdatePosition() {
    if (this.props.focusedArea === FOCUS_AREAS.PROJECT_BROWSER) {
      triggerUpdateHelpboxPositionViaProjectBrowser();
    }
    if (this.props.focusedArea === FOCUS_AREAS.NODE_SUGGESTER) {
      triggerUpdateHelpboxPositionViaSuggester();
    }
  }
  updateRef(el) {
    this.helpboxRef = el;
  }
  render() {
    const { maybeSelectedPatch, isVisible, actions } = this.props;
    if (!isVisible) return null;
    const isHidden = (
      !isVisible ||
      Maybe.isNothing(maybeSelectedPatch) ||
      !this.state.isVisible ||
      this.state.top === 0
    );

    const docs = maybeSelectedPatch
      .map(patch => <PatchDocs patch={patch} />)
      .getOrElse(null);

    const cls = cn('Helpbox', {
      'Helpbox--hidden': isHidden,
    });

    return (
      <div className={cls} style={this.getHelpboxOffset()} ref={this.updateRef}>
        <div className="pointer" style={this.getPointerOffset()} />
        <CloseButton
          tabIndex="0"
          onClick={actions.hideHelpbox}
        />
        <div className="Helpbox-content">
          <CustomScroll flex="1">
            {docs}
          </CustomScroll>
        </div>
      </div>
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
  actions: bindActionCreators({
    hideHelpbox: Actions.hideHelpbox,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Helpbox);
