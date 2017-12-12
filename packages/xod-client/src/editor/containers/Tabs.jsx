import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  SortableContainer as sortableContainer,
  SortableElement as sortableElement,
} from 'react-sortable-hoc';

import * as Actions from '../actions';
import * as ProjectSelectors from '../../project/selectors';
import { assocIndexes, indexById } from '../../utils/array';
import deepSCU from '../../utils/deepSCU';
import TabsContainer from '../components/TabsContainer';
import TabsItem from '../components/TabsItem';

const SortableItem = sortableElement(
  ({ value }) => (
    <TabsItem
      key={value.id}
      data={value}
      onClick={value.onClick}
      onClose={value.onClose}
    />
  )
);

const SortableList = sortableContainer(
  ({ items, onClick, onClose }) => (
    <TabsContainer>
      {items.map((value, index) => {
        const item = R.merge(
          value,
          {
            onClick,
            onClose,
          }
        );

        return (
          <SortableItem
            key={`item-${value.id}`}
            index={index}
            value={item}

            onClick={onClick}
            onClose={onClose}
          />
        );
      }
      )}
    </TabsContainer>
  )
);


class Tabs extends React.Component {
  constructor(props) {
    super(props);

    this.shouldComponentUpdate = deepSCU.bind(this);
  }

  onSwitchTab = (tabId) => {
    // a little hack to correctly handle onBlur etc events
    setTimeout(() => this.props.actions.switchTab(tabId), 0);
  };

  onCloseTab = (tabId) => {
    // a little hack to correctly handle onBlur etc events, same as in onSwitchTab
    setTimeout(() => this.props.actions.closeTab(tabId), 0);
  };

  onSortEnd = ({ oldIndex, newIndex }) => {
    const tabs = this.getTabs();
    return R.compose(
      this.props.actions.sortTabs,
      indexById,
      assocIndexes,
      R.insert(newIndex, tabs[oldIndex]),
      R.remove(oldIndex, 1)
    )(tabs);
  };

  getTabs() {
    return R.sortBy(
      R.prop('index')
    )(R.values(this.props.tabs));
  }

  render() {
    const tabs = this.getTabs();
    return (
      <SortableList
        items={tabs}
        onSortEnd={this.onSortEnd}
        axis="x"
        lockAxis="x"
        lockToContainerEdges
        lockOffset="-5%"
        helperClass="is-sorting"

        onClick={this.onSwitchTab}
        onClose={this.onCloseTab}
      />
    );
  }
}

Tabs.propTypes = {
  tabs: PropTypes.object,
  actions: PropTypes.objectOf(PropTypes.func),
};

const mapStateToProps = R.applySpec({
  tabs: ProjectSelectors.getPreparedTabs,
});

const mapDispatchToprops = dispatch => ({
  actions: bindActionCreators({
    switchTab: Actions.switchTab,
    closeTab: Actions.closeTab,
    sortTabs: Actions.sortTabs,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToprops)(Tabs);
