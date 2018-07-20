import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import $ from 'sanctuary-def';
import { $Maybe, foldMaybe, noop } from 'xod-func-tools';
import { Icon } from 'react-fa';
import { shouldUpdate } from 'recompose';

import sanctuaryPropType from '../../utils/sanctuaryPropType';
import Breadcrumbs from './Breadcrumbs';
import TooltipHOC from '../../tooltip/components/TooltipHOC';

import { DEBUGGER_TAB_ID } from '../../editor/constants';

const DebuggerTopPane = props =>
  foldMaybe(
    null,
    tab =>
      tab.id === DEBUGGER_TAB_ID && props.isDebugSessionRunning ? (
        <Breadcrumbs>
          {props.isDebugSessionOutdated ? (
            <TooltipHOC
              content={
                <div>
                  The program on screen is newer than the program running on the
                  board.<br />
                  Watches and overall behavior can be incorrect. Stop debugging
                  and upload again to synchronize.
                </div>
              }
              render={(onMouseOver, onMouseMove, onMouseLeave) => (
                <div
                  className="debugging-outdated"
                  onMouseOver={onMouseOver}
                  onMouseMove={onMouseMove}
                  onMouseLeave={onMouseLeave}
                >
                  Program changed
                  <Icon name="question-circle" />
                </div>
              )}
            />
          ) : null}
          <button
            className="debug-session-stop-button Button Button--light"
            onClick={props.stopDebuggerSession}
          >
            <Icon name="stop" /> Stop debug
          </button>
        </Breadcrumbs>
      ) : null,
    props.currentTab
  );

DebuggerTopPane.propTypes = {
  currentTab: sanctuaryPropType($Maybe($.Object)),
  isDebugSessionRunning: PropTypes.bool,
  isDebugSessionOutdated: PropTypes.bool,
  stopDebuggerSession: PropTypes.func,
};

DebuggerTopPane.defaultProps = {
  isDebugSessionRunning: false,
  isDebugSessionOutdated: false,
  stopDebuggerSession: noop,
};

export default shouldUpdate(
  R.compose(
    R.not,
    R.eqBy(
      R.evolve({
        currentTab: foldMaybe(null, R.identity),
        stopDebuggerSession: () => null,
      })
    )
  )
)(DebuggerTopPane);
