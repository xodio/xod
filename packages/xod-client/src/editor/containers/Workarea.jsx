import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import cn from 'classnames';
import debounce from 'throttle-debounce/debounce';
import { notEquals } from 'xod-func-tools';

import { ReflexContainer, ReflexSplitter, ReflexElement } from 'react-reflex';
import Debugger from '../../debugger/containers/Debugger';

import { SLOT_SIZE } from '../../project/nodeLayout';
import { PANEL_IDS } from '../constants';
import * as Actions from '../actions';
import * as EditorSelectors from '../selectors';

const pickPropsToCheck = R.compose(
  R.evolve({ panelSettings: R.map(R.omit(['size'])) }),
  R.pick(['children', 'panelSettings', 'windowSize'])
);

class Workarea extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      resizing: false,
      sizes: {
        WORKAREA: 1,
        [PANEL_IDS.DEPLOYMENT]: props.panelSettings.size || 0,
      },
    };

    this.onResizePanel = this.onResizePanel.bind(this);
    this.onStartResizePanel = this.onStartResizePanel.bind(this);
    this.onStopResizePanel = this.onStopResizePanel.bind(this);

    this.resizePanelAction = debounce(300, this.props.actions.resizePanel);
  }
  shouldComponentUpdate(nextProps) {
    // Optimize rendering
    return notEquals(pickPropsToCheck(nextProps), pickPropsToCheck(this.props));
  }
  onResizePanel(event) {
    const { name, flex } = event.component.props;
    this.setState(R.assocPath(['sizes', name], flex));
    this.resizePanelAction(
      PANEL_IDS.DEPLOYMENT,
      this.state.sizes[PANEL_IDS.DEPLOYMENT]
    );
  }
  onStartResizePanel() {
    this.setState({ resizing: true });
  }
  onStopResizePanel() {
    this.setState({ resizing: false });
  }
  getDeploymentPanelSize() {
    const size = R.propOr(0.2, 'size', this.props.panelSettings);
    return this.props.isDebugPanelExpanded ? size : 0;
  }
  render() {
    return (
      <ReflexContainer
        className={cn('Workarea-content', {
          isCollapsed: !this.props.isDebugPanelExpanded,
        })}
        orientation="horizontal"
      >
        <ReflexElement
          className="Workarea-inner"
          minSize={SLOT_SIZE.HEIGHT}
          name="WORKAREA"
          flex={this.props.isDebugPanelExpanded ? this.state.sizes.workarea : 1}
          onResize={this.onResizePanel}
        >
          {this.props.children}
        </ReflexElement>
        <ReflexSplitter
          onStartResize={this.onStartResizePanel}
          onStopResize={this.onStopResizePanel}
        />
        <ReflexElement
          minSize={this.props.isDebugPanelExpanded ? 100 : 24}
          flex={this.getDeploymentPanelSize()}
          name={PANEL_IDS.DEPLOYMENT}
          onResize={this.onResizePanel}
          className="Deployment-pane"
        >
          <Debugger
            isResizing={this.state.resizing}
            stopDebuggerSession={this.props.stopDebuggerSession}
            onUploadClick={this.props.onUploadClick}
            onUploadAndDebugClick={this.props.onUploadAndDebugClick}
            onRunSimulationClick={this.props.onRunSimulationClick}
          />
        </ReflexElement>
      </ReflexContainer>
    );
  }
}

Workarea.propTypes = {
  // Props propagated from <Editor>
  children: PropTypes.node.isRequired,
  // We need windowSize to re-render component on window resizing
  // eslint-disable-next-line react/no-unused-prop-types
  windowSize: PropTypes.object.isRequired,
  // Props via connect
  isDebugPanelExpanded: PropTypes.bool.isRequired,
  panelSettings: PropTypes.object.isRequired,
  // Actions propagated from <App>
  stopDebuggerSession: PropTypes.func.isRequired,
  onUploadClick: PropTypes.func.isRequired,
  onUploadAndDebugClick: PropTypes.func.isRequired,
  onRunSimulationClick: PropTypes.func.isRequired,
  // Actions binded with connect
  actions: PropTypes.shape({
    resizePanel: PropTypes.func.isRequired,
  }),
};

const mapStateToProps = R.applySpec({
  isDebugPanelExpanded: EditorSelectors.isPanelMaximized(PANEL_IDS.DEPLOYMENT),
  panelSettings: EditorSelectors.getPanelSettings(PANEL_IDS.DEPLOYMENT),
});

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(
    {
      resizePanel: Actions.resizePanel,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(Workarea);
