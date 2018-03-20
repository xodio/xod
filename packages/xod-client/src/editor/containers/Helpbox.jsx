import * as R from 'ramda';
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
      width: 0,
      height: 0,
      rightSided: false,
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
    if (
      prevState.height !== this.helpboxRef.clientHeight ||
      prevState.width !== this.helpboxRef.clientWidth
    ) {
      this.triggerUpdatePosition();
    }
  }
  componentWillUnmount() {
    window.removeEventListener(UPDATE_HELPBOX_POSITION, this.onUpdatePosition);
  }
  onUpdatePosition(event) {
    // If helpbox refers to an element that is too close to the right side and
    // helpbox could not fit window, it will be switched to the "rightSide"
    // mode. That also means the pointer will be translated to the right side
    // and helpbox will be positioned at the left side of referred element E.g.
    //
    // ProjectBrowser at the left side — Helpbox is not "rightSided" helpbox;
    // ProjectBrowser at the right side — Helpbox "rightSided".
    //
    // Also if the helpbox is too wide to fit either side, a jut would be
    // applied so that it will be completely visible at the expense of
    // overlaping the referred element.
    const windowWidth = window.innerWidth;
    const elWidth = this.helpboxRef.clientWidth;
    const overflow = Math.max(0, event.detail.right + elWidth - windowWidth);
    const underflow = Math.max(0, elWidth - event.detail.left);
    const rightSided = overflow > underflow;
    const jut = rightSided ? underflow : -overflow;
    const left =
      jut + (rightSided ? event.detail.left - elWidth : event.detail.right);

    const top = event.detail.top;
    const windowHeight = window.innerHeight;
    const elHeight = this.helpboxRef.clientHeight;
    const isFitWindow = top + elHeight < windowHeight;
    const newTop = isFitWindow ? top : windowHeight - elHeight;
    const newPointer = isFitWindow ? 0 : top - newTop;

    this.setState({
      isVisible: event.detail.isVisible,
      left,
      top: newTop,
      pointerTop: newPointer,
      height: elHeight,
      width: elWidth,
      rightSided,
    });
  }
  getHelpboxOffset() {
    return {
      transform: `translate(${this.state.left}px, ${this.state.top}px)`,
    };
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
    const isHidden =
      !isVisible ||
      Maybe.isNothing(maybeSelectedPatch) ||
      !this.state.isVisible ||
      this.state.top === 0;

    const docs = maybeSelectedPatch
      .map(patch => <PatchDocs patch={patch} />)
      .getOrElse(null);

    const cls = cn('Helpbox', {
      'Helpbox--hidden': isHidden,
      'Helpbox--rightSided': this.state.rightSided,
    });

    return (
      <div className={cls} style={this.getHelpboxOffset()} ref={this.updateRef}>
        <div className="pointer" style={this.getPointerOffset()} />
        <CloseButton tabIndex="0" onClick={actions.hideHelpbox} />
        <div className="Helpbox-content">
          <CustomScroll flex="1">{docs}</CustomScroll>
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
  actions: bindActionCreators(
    {
      hideHelpbox: Actions.hideHelpbox,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(Helpbox);
