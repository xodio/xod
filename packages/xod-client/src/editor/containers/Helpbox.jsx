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
import { isHelpboxVisible } from '../selectors';
import { getPatchForHelpbox } from '../../core/selectors';
import PatchDocs from '../components/PatchDocs';
import sanctuaryPropType from '../../utils/sanctuaryPropType';
import CloseButton from '../../core/components/CloseButton';

import { UPDATE_HELPBOX_POSITION } from '../constants';
import { triggerUpdateHelpboxPosition } from '../utils';

class Helpbox extends React.Component {
  constructor(props) {
    super(props);

    this.helpboxRef = null;

    this.state = {
      isVisible: true,
      top: 50,
      pointerTop: 0,
      height: 0,
    };

    this.updateRef = this.updateRef.bind(this);
    this.updatePosition = this.updatePosition.bind(this);
    this.getHelpboxOffset = this.getHelpboxOffset.bind(this);
    this.getPointerOffset = this.getPointerOffset.bind(this);

    this.onUpdatePosition = this.onUpdatePosition.bind(this);
  }
  componentDidMount() {
    window.addEventListener(UPDATE_HELPBOX_POSITION, this.onUpdatePosition);
    triggerUpdateHelpboxPosition();
  }
  componentDidUpdate(prevProps, prevState) {
    if (prevState.isVisible && !this.state.isVisible) {
      this.props.actions.hideHelpbox();
      return;
    }
    if (prevState.height !== this.helpboxRef.clientHeight) {
      triggerUpdateHelpboxPosition();
    }
  }
  componentWillUnmount() {
    window.removeEventListener(UPDATE_HELPBOX_POSITION, this.onUpdatePosition);
  }
  onUpdatePosition(event) {
    this.setState({
      isVisible: event.detail.isVisible,
    });
    this.updatePosition(event.detail.top);
  }
  getHelpboxOffset() {
    return { transform: `translateY(${this.state.top}px)` };
  }
  getPointerOffset() {
    return { transform: `translateY(${this.state.pointerTop}px)` };
  }
  updatePosition(elTop) {
    const windowHeight = window.innerHeight;
    const elHeight = this.helpboxRef.clientHeight;
    const isFitWindow = (elTop + elHeight < windowHeight);
    const newTop = isFitWindow ? elTop : windowHeight - elHeight;
    const newPointer = isFitWindow ? 0 : elTop - newTop;

    this.setState({
      top: newTop,
      pointerTop: newPointer,
      height: elHeight,
    });
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
      !this.state.isVisible
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
          <CustomScroll flex={1}>
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
  actions: PropTypes.shape({
    // eslint-disable-next-line react/no-unused-prop-types
    hideHelpbox: PropTypes.func.isRequired,
  }),
};

const mapStateToProps = R.applySpec({
  isVisible: isHelpboxVisible,
  maybeSelectedPatch: getPatchForHelpbox,
});
const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    hideHelpbox: Actions.hideHelpbox,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(Helpbox);
