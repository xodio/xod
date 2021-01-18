import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import storeShape from 'react-redux/src/utils/storeShape';
import { Icon } from 'react-fa';
import cls from 'classnames';

import { recoverState } from '../actions';
import CloseButton from '../components/CloseButton';
import { getUtmForumUrl } from '../../utils/urls';

class Catcher extends React.Component {
  constructor(props) {
    super(props);

    this.timer = null;
    this.stableState = props.store.getState();
    this.state = {
      error: null,
      errorInfo: null,
      recovering: false,
    };

    this.unsubscribe = props.store.subscribe(() => {
      const nextState = props.store.getState();
      if (this.stableState !== nextState) {
        clearTimeout(this.timer);
        // Postpone memoizing of the stable state on the next
        // tick after getting updated store state,
        // because the new store state might cause an error
        this.timer = setTimeout(() => {
          this.stableState = nextState;
        }, 0);
      }
    });

    // Ref to the App container is needed to call methods
    // if there are no errors or got some
    this.appRef = null;

    // Ref to the Textarea with the error log
    // is needed to select all on focus
    this.textareaRef = null;

    this.onClose = this.onClose.bind(this);
    this.selectAllTextareaContent = this.selectAllTextareaContent.bind(this);
  }

  componentDidMount() {
    // Open initial project on the startup
    this.appRef.refs.wrappedInstance.onFirstRun();
  }

  componentWillUnmount() {
    this.unsubscribe();
  }

  onClose() {
    this.setState({ error: null, errorInfo: null });
  }

  getErrorReport() {
    const isActionErrored = !R.equals(
      this.stableState.lastActions,
      this.props.store.getState().lastActions
    );

    const lastOneCausedError = [
      '# AND THE LAST ONE CAUSED AN ERROR:',
      '# YOU CAN TRY TO DISPATCH THE LAST ONE',
      '# TO REPROUCE THE ERROR',
    ].join('\n');

    const stableStateReport = R.compose(
      stableState => JSON.stringify(stableState, null, 2),
      R.assocPath(['project', 'apiKey'], 'SECRET'),
      R.assocPath(['user', 'grant'], 'SECRET'),
      R.omit(['lastSavedProject', 'projectHistory'])
    )(this.stableState);

    return [
      // Error
      '# ERROR',
      this.state.error.stack,
      '# COMPONENT STACK',
      this.state.errorInfo.componentStack,
      '\n\n',
      '# LAST ACTIONS (max 3 in log)',
      isActionErrored ? lastOneCausedError : '# BUT NONE OF THEM IS THE REASON',
      JSON.stringify(this.props.store.getState().lastActions, null, 2),
      '\n\n',
      '# STABLE STATE',
      '# WITH OMITED `lastSavedProject` AND `projectHistory`',
      stableStateReport,
    ].join('\n');
  }

  selectAllTextareaContent() {
    this.textareaRef.select();
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo, recovering: true });
    setTimeout(() => {
      // Recover on the next tick after <App> component will be mounted again
      // and default project will be loaded
      this.props.store.dispatch(recoverState(this.stableState));
      this.setState({ recovering: false });
    }, 0);
    clearTimeout(this.timer);
  }

  renderErrorReport() {
    if (!this.state.error) return null;

    const recovering = this.state.recovering ? (
      <div className="Recovering">
        <Icon name="circle-o-notch" size="5x" spin />
        <h2>Recovering...</h2>
      </div>
    ) : null;

    return (
      <div
        className={cls('IdeCrashReport', {
          'is-shaded': this.state.recovering,
        })}
      >
        {recovering}
        <div className="Message">
          <CloseButton onClick={this.onClose} />
          <h1>Something went wrong</h1>
          <p>
            First of all, save the project after recovering process is complete.
          </p>
          <p>
            Then, please, report the bug to{' '}
            <a
              href={getUtmForumUrl('ide-crash-report')}
              target="_blank"
              rel="noopener noreferrer"
            >
              the forum
            </a>{' '}
            or{' '}
            <a
              href="https://github.com/xodio/xod/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              github issues
            </a>{' '}
            using the information from the textarea below.
          </p>
          <textarea
            readOnly
            ref={el => (this.textareaRef = el)}
            onFocus={this.selectAllTextareaContent}
            value={this.getErrorReport()}
          />
        </div>
      </div>
    );
  }

  render() {
    const childElement = React.Children.only(this.props.children);

    return (
      <React.Fragment>
        {this.renderErrorReport()}
        <Provider store={this.props.store}>
          {React.cloneElement(childElement, { ref: el => (this.appRef = el) })}
        </Provider>
      </React.Fragment>
    );
  }
}

Catcher.propTypes = {
  store: storeShape,
  children: PropTypes.element.isRequired,
};

export default Catcher;
