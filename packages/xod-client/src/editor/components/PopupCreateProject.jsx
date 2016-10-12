import React from 'react';
import SkyLight from 'react-skylight';

class PopupCreateProject extends React.Component {
  constructor(props) {
    super(props);

    this.onConfirm = this.onConfirm.bind(this);
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.isVisible) {
      this.show();
    } else {
      this.hide();
    }
  }

  show() {
    this.refs.popup.show();
  }

  hide() {
    this.refs.popup.hide();
  }

  onConfirm(evt) {
    evt.preventDefault();

    const value = this.refs.input.value;
    this.props.onConfirm(value);

    return false;
  }

  render() {
    return (
      <SkyLight
        hideOnOverlayClicked
        dialogStyles={{
          height: 'auto',
        }}
        ref="popup"
        title="Create new project"
        onCloseClicked={this.props.onClose}
        onOverlayClicked={this.props.onClose}
      >
       <p>Give a sonorous name to your new project:</p>
       <form onSubmit={this.onConfirm}>
         <input ref="input" type="text" autoFocus />
         <button type="submit">Create a project</button>
       </form>
      </SkyLight>
    );
  }
}

PopupCreateProject.propTypes = {
  isVisible: React.PropTypes.bool,
  onConfirm: React.PropTypes.func,
  onClose: React.PropTypes.func,
};

export default PopupCreateProject;
