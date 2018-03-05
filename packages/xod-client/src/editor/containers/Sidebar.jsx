import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import $ from 'sanctuary-def';
import cls from 'classnames';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { FocusTrap } from 'react-hotkeys';
import { ReflexContainer, ReflexSplitter, ReflexElement } from 'react-reflex';
import * as XP from 'xod-project';
import { $Maybe, mapIndexed, notEquals } from 'xod-func-tools';
import debounce from 'throttle-debounce/debounce';

import HelpPanel from './HelpPanel';
import Inspector from '../components/Inspector';
import AccountPane from '../../user/containers/AccountPane';
import ProjectBrowser from '../../projectBrowser/containers/ProjectBrowser';
import SidebarSwitches from '../components/SidebarSwitches';

import * as EditorActions from '../actions';
import * as EditorSelectors from '../selectors';
import * as ProjectActions from '../../project/actions';
import * as ProjectSelectors from '../../project/selectors';
import * as UserSelectors from '../../user/selectors';
import { RenderableSelection } from '../../types';
import sanctuaryPropType from '../../utils/sanctuaryPropType';
import { SIDEBAR_IDS, PANEL_IDS, FOCUS_AREAS } from '../constants';
import {
  sidebarPanelRenderer,
  getPanelsBySidebarId,
  getMaximizedPanelsBySidebarId,
  filterMaximized,
} from '../utils';

const MIN_SIZE = 200;

const pickPropsToCheck = R.compose(
  R.evolve({
    panels: R.map(R.omit(['size'])),
  }),
  R.pick([
    'id',
    'windowSize',
    'selection',
    'currentPatch',
    'panels',
    'userAuthorised',
  ])
);

const getSizes = props => {
  const panels = getMaximizedPanelsBySidebarId(props.id, props.panels);
  return R.compose(R.fromPairs, R.map(R.over(R.lensIndex(1), R.prop('size'))))(
    panels
  );
};

class Sidebar extends React.Component {
  constructor(props) {
    super(props);

    this.containerRef = null;

    this.state = {};

    this.setContainerRef = this.setContainerRef.bind(this);
    this.isResizable = this.isResizable.bind(this);

    this.onResizePane = this.onResizePane.bind(this);
    this.onProjectBrowserFocus = this.onProjectBrowserFocus.bind(this);
    this.onInspectorFocus = this.onInspectorFocus.bind(this);

    this.renderProjectBrowser = this.renderProjectBrowser.bind(this);
    this.renderInspector = this.renderInspector.bind(this);
    this.renderHelpbar = this.renderHelpbar.bind(this);
    this.renderAccountPane = this.renderAccountPane.bind(this);
    this.renderPanel = this.renderPanel.bind(this);

    this.resizePanelsAction = debounce(300, this.props.actions.resizePanels);
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.panels !== nextProps.panels && !this.state.sizes) {
      this.setState(R.assoc('sizes', getSizes(nextProps)));
    }
  }
  shouldComponentUpdate(nextProps) {
    // Optimize rendering of the sidebars
    return notEquals(pickPropsToCheck(nextProps), pickPropsToCheck(this.props));
  }
  onResizePane(event) {
    const { name, flex } = event.component.props;
    this.setState(R.assocPath(['sizes', name], flex));
    this.resizePanelsAction(this.state.sizes);
  }
  onProjectBrowserFocus() {
    this.props.actions.setFocusedArea(FOCUS_AREAS.PROJECT_BROWSER);
  }
  onInspectorFocus() {
    this.props.actions.setFocusedArea(FOCUS_AREAS.INSPECTOR);
  }
  getPanelSize(panelId) {
    return R.pathOr(0.5, ['sizes', panelId], this.state);
  }
  setContainerRef(el) {
    this.containerRef = el;
    // to render it once when we can calculate height
    this.forceUpdate();
  }
  isResizable() {
    const panelsCount = getMaximizedPanelsBySidebarId(
      this.props.id,
      this.props.panels
    ).length;
    return (
      this.containerRef &&
      this.containerRef.clientHeight > MIN_SIZE * panelsCount
    );
  }
  renderProjectBrowser(settings) {
    return (
      <FocusTrap
        key={PANEL_IDS.PROJECT_BROWSER}
        className="ProjectBrowser-container"
        onFocus={this.onProjectBrowserFocus}
      >
        <ProjectBrowser
          sidebarId={settings.sidebar}
          autohide={settings.autohide}
        />
      </FocusTrap>
    );
  }
  renderInspector(settings) {
    return (
      <FocusTrap
        key={PANEL_IDS.INSPECTOR}
        className="Inspector-container"
        onFocus={this.onInspectorFocus}
      >
        <Inspector
          sidebarId={settings.sidebar}
          autohide={settings.autohide}
          selection={this.props.selection}
          currentPatch={this.props.currentPatch}
          onPropUpdate={this.props.actions.updateNodeProperty}
          onPatchDescriptionUpdate={this.props.actions.updatePatchDescription}
        />
      </FocusTrap>
    );
  }
  // eslint-disable-next-line class-methods-use-this
  renderHelpbar(settings) {
    return (
      <HelpPanel
        key={PANEL_IDS.HELPBAR}
        sidebarId={settings.sidebar}
        autohide={settings.autohide}
      />
    );
  }
  // eslint-disable-next-line class-methods-use-this
  renderAccountPane(settings) {
    return (
      <AccountPane
        key={PANEL_IDS.ACCOUNT}
        sidebarId={settings.sidebar}
        autohide={settings.autohide}
      />
    );
  }
  renderPanel(panelSettings) {
    return R.cond([
      sidebarPanelRenderer(
        PANEL_IDS.PROJECT_BROWSER,
        this.renderProjectBrowser
      ),
      sidebarPanelRenderer(PANEL_IDS.INSPECTOR, this.renderInspector),
      sidebarPanelRenderer(PANEL_IDS.HELPBAR, this.renderHelpbar),
      sidebarPanelRenderer(PANEL_IDS.ACCOUNT, this.renderAccountPane),
    ])(panelSettings);
  }
  render() {
    const panels = getPanelsBySidebarId(this.props.id, this.props.panels);
    const maximizedPanels = filterMaximized(panels);

    const classNames = cls('Sidebar', {
      'Sidebar--left': this.props.id === SIDEBAR_IDS.LEFT,
      'Sidebar--right': this.props.id === SIDEBAR_IDS.RIGHT,
      'Sidebar--hidden': maximizedPanels.length === 0,
    });

    const lastIndex = maximizedPanels.length - 1;
    return (
      <div className={classNames} ref={this.setContainerRef}>
        <SidebarSwitches
          isMinimized={false}
          id={this.props.id}
          panels={this.props.panels}
          onTogglePanel={this.props.actions.togglePanel}
          isLoggedIn={this.props.userAuthorised}
        />
        {maximizedPanels.length > 1 && (
          <ReflexContainer className="Sidebar-content" orientation="horizontal">
            {R.compose(
              R.unnest,
              mapIndexed((panel, index) => [
                <ReflexElement
                  key={`panel_${panel[0]}`}
                  name={panel[0]}
                  minSize={MIN_SIZE}
                  flex={this.getPanelSize(panel[0])}
                  onResize={this.onResizePane}
                >
                  {this.renderPanel(panel)}
                </ReflexElement>,
                index !== lastIndex &&
                  this.isResizable() && (
                    <ReflexSplitter key={`splitter_${panel[0]}`} propagate />
                  ),
              ])
            )(maximizedPanels)}
          </ReflexContainer>
        )}
        {maximizedPanels.length === 1 && this.renderPanel(maximizedPanels[0])}
      </div>
    );
  }
}

Sidebar.propTypes = {
  id: PropTypes.string.isRequired,
  // We need windowSize to re-render component on window resizing
  // eslint-disable-next-line react/no-unused-prop-types
  windowSize: PropTypes.object.isRequired,
  selection: sanctuaryPropType($.Array(RenderableSelection)),
  currentPatch: sanctuaryPropType($Maybe(XP.Patch)),
  panels: PropTypes.objectOf(
    PropTypes.shape({
      /* eslint-disable react/no-unused-prop-types */
      maximized: PropTypes.bool.isRequired,
      sidebar: PropTypes.oneOf(R.values(SIDEBAR_IDS)).isRequired,
      autohide: PropTypes.bool.isRequired,
      /* eslint-enable react/no-unused-prop-types */
    })
  ),
  actions: PropTypes.shape({
    updateNodeProperty: PropTypes.func.isRequired,
    updatePatchDescription: PropTypes.func.isRequired,
    resizePanels: PropTypes.func.isRequired,
    togglePanel: PropTypes.func.isRequired,
    setFocusedArea: PropTypes.func.isRequired,
  }),
  userAuthorised: PropTypes.bool.isRequired,
};

const mapStateToProps = R.applySpec({
  selection: ProjectSelectors.getRenderableSelection,
  currentPatch: ProjectSelectors.getCurrentPatch,
  panels: EditorSelectors.getAllPanelsSettings,
  userAuthorised: UserSelectors.isAuthorized,
});
const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(
    {
      updateNodeProperty: ProjectActions.updateNodeProperty,
      updatePatchDescription: ProjectActions.updatePatchDescription,
      resizePanels: EditorActions.resizePanels,
      togglePanel: EditorActions.togglePanel,
      setFocusedArea: EditorActions.setFocusedArea,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToProps)(Sidebar);
