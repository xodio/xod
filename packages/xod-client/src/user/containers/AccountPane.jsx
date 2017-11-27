import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { foldMaybe } from 'xod-func-tools';

import Button from '../../core/components/Button';

import * as Actions from '../actions';
import * as Selectors from '../selectors';

import AuthForm from '../components/AuthForm';

const AccountPane = ({
  user,
  isVisible,
  compilationsLeft,
  actions,
  isAuthorising,
  authError,
}) => {
  if (!isVisible) return null;

  return (
    <div className="AccountPane">
      <a
        role="button"
        tabIndex="0"
        className="close-button"
        onClick={actions.toggleAccountPane}
      >
        &times;
      </a>

      {foldMaybe(
        <div className="username">Guest Xoder</div>,
        ({ username }) => (
          <div>
            <div>Logged in as</div>
            <div className="username">{username}</div>
          </div>
        ),
        user
      )}

      <div className="dailyQuotas">
        <div className="title">Daily quotas</div>
        <div>
          Compilations: {compilationsLeft == null ? 'currently offline' : compilationsLeft}
        </div>
      </div>

      {foldMaybe(
        <AuthForm onLogin={actions.login} {...{ isAuthorising, authError }} />,
        () => (<Button onClick={actions.logout}>Logout</Button>),
        user
      )}
    </div>
  );
};

AccountPane.propTypes = {
  compilationsLeft: PropTypes.number,
  isVisible: PropTypes.bool.isRequired,
  user: PropTypes.object,
  isAuthorising: PropTypes.bool.isRequired,
  authError: PropTypes.string,
  actions: PropTypes.shape({
    toggleAccountPane: PropTypes.func.isRequired, // eslint-disable-line react/no-unused-prop-types
    login: PropTypes.func.isRequired, // eslint-disable-line react/no-unused-prop-types
  }),
};

const mapStateToProps = R.applySpec({
  isVisible: Selectors.isAccountPaneVisible,
  user: Selectors.getUser,
  compilationsLeft: Selectors.getCompileLimitLeft,
  isAuthorising: Selectors.isAuthorising,
  authError: Selectors.getAuthError,
});
const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators({
    toggleAccountPane: Actions.toggleAccountPane,
    login: Actions.login,
    logout: Actions.logout,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(AccountPane);
