import * as R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { sortableContainer, sortableElement } from 'react-sortable-hoc';

import * as Actions from '../actions';
import * as Selectors from '../selectors';
import * as UserSelectors from '../../user/selectors';
import { assocIndexes, indexById } from '../../utils/array';
import deepSCU from '../../utils/deepSCU';
import TabsContainer from '../components/TabsContainer';
import TabsItem from '../components/TabsItem';
import SidebarSwitches from '../components/SidebarSwitches';

import { SIDEBAR_IDS } from '../constants';

const SortableItem = sortableElement(({ value }) => (
  <TabsItem
    key={value.id}
    data={value}
    onClick={value.onClick}
    onClose={value.onClose}
  />
));

const SortableList = sortableContainer(({ items, onClick, onClose }) => (
  <TabsContainer>
    {items.map((value, index) => {
      const item = R.merge(value, {
        onClick,
        onClose,
      });

      return (
        <SortableItem
          key={`item-${value.id}`}
          index={index}
          value={item}
          onClick={onClick}
          onClose={onClose}
        />
      );
    })}
  </TabsContainer>
));

class Tabs extends React.Component {
  constructor(props) {
    super(props);

    this.onTabClick = this.onTabClick.bind(this);
    this.onCloseTab = this.onCloseTab.bind(this);
    this.onSortEnd = this.onSortEnd.bind(this);

    this.shouldComponentUpdate = deepSCU.bind(this);
  }

  onTabClick(tabId, event) {
    if (event.button === 1) {
      this.onCloseTab(tabId);
    } else {
      // a little hack to correctly handle onBlur etc events
      setTimeout(() => this.props.actions.switchTab(tabId), 0);
    }
  }

  onCloseTab(tabId) {
    // a little hack to correctly handle onBlur etc events, same as in onTabClick
    setTimeout(() => this.props.actions.closeTab(tabId), 0);
  }

  onSortEnd({ oldIndex, newIndex }) {
    const tabs = this.getTabs();
    return R.compose(
      this.props.actions.sortTabs,
      indexById,
      assocIndexes,
      R.insert(newIndex, tabs[oldIndex]),
      R.remove(oldIndex, 1)
    )(tabs);
  }

  getTabs() {
    return R.sortBy(R.prop('index'))(R.values(this.props.tabs));
  }

  render() {
    const tabs = this.getTabs();
    return (
      <div className="Tabs">
        <SidebarSwitches
          id={SIDEBAR_IDS.LEFT}
          isMinimized
          panels={this.props.panels}
          onTogglePanel={this.props.actions.togglePanel}
          isLoggedIn={this.props.userAuthorised}
        />
        <SidebarSwitches
          id={SIDEBAR_IDS.RIGHT}
          isMinimized
          panels={this.props.panels}
          onTogglePanel={this.props.actions.togglePanel}
          isLoggedIn={this.props.userAuthorised}
        />
        <SortableList
          items={tabs}
          onSortEnd={this.onSortEnd}
          axis="x"
          lockAxis="x"
          lockToContainerEdges
          lockOffset="-5%"
          helperClass="is-sorting"
          onClick={this.onTabClick}
          onClose={this.onCloseTab}
        />
      </div>
    );
  }
}

Tabs.propTypes = {
  tabs: PropTypes.object,
  actions: PropTypes.objectOf(PropTypes.func),
  panels: PropTypes.objectOf(
    PropTypes.shape({
      /* eslint-disable react/no-unused-prop-types */
      maximized: PropTypes.bool.isRequired,
      sidebar: PropTypes.oneOf(R.values(SIDEBAR_IDS)).isRequired,
      autohide: PropTypes.bool.isRequired,
      /* eslint-enable react/no-unused-prop-types */
    })
  ),
  userAuthorised: PropTypes.bool.isRequired,
};

const mapStateToProps = R.applySpec({
  tabs: Selectors.getPreparedTabs,
  panels: Selectors.getAllPanelsSettings,
  userAuthorised: UserSelectors.isAuthorized,
});

const mapDispatchToprops = dispatch => ({
  actions: bindActionCreators(
    {
      switchTab: Actions.switchTab,
      closeTab: Actions.closeTab,
      sortTabs: Actions.sortTabs,
      togglePanel: Actions.togglePanel,
    },
    dispatch
  ),
});

export default connect(mapStateToProps, mapDispatchToprops)(Tabs);
