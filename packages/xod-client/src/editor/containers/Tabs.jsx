import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import {
  SortableContainer as sortableContainer,
  SortableElement as sortableElement,
} from 'react-sortable-hoc';

import { swap } from 'xod-func-tools';

import * as Actions from '../actions';
import * as ProjectSelectors from '../../project/selectors';
import { assocIndexes, indexById } from '../../utils/array';
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

    this.onSwitchPatch = this.onSwitchPatch.bind(this);
    this.onCloseTab = this.onCloseTab.bind(this);
    this.onSortEnd = this.onSortEnd.bind(this);
  }

  onSwitchPatch(patchPath) {
    // a little hack to correctly handle onBlur etc events
    setTimeout(() => this.props.actions.switchPatch(patchPath), 0);
  }

  onCloseTab(patchPath) {
    // a little hack to correctly handle onBlur etc events, same as in onSwitchPatch
    setTimeout(() => this.props.actions.closeTab(patchPath), 0);
  }

  onSortEnd(changes) {
    const sortedTabs = swap(changes.oldIndex, changes.newIndex, this.getTabs());
    const newTabs = assocIndexes(sortedTabs);
    const indexedTabs = indexById(newTabs);

    this.props.actions.sortTabs(indexedTabs);
  }

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

        onClick={this.onSwitchPatch}
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
    switchPatch: Actions.switchPatch,
    closeTab: Actions.closeTab,
    sortTabs: Actions.sortTabs,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToprops)(Tabs);
