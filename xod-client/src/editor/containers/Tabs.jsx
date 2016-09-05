import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../actions';
import * as EditorSelectors from '../selectors';

import { swap, assocIndexes, indexById } from 'xod-client/utils/array';

import {
  SortableContainer as sortableContainer,
  SortableElement as sortableElement,
} from 'react-sortable-hoc';

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

  onSwitchPatch(patchId) {
    return this.props.actions.switchPatch(patchId);
  }

  onCloseTab(patchId) {
    return this.props.actions.closeTab(patchId);
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
  tabs: React.PropTypes.object,
  actions: React.PropTypes.objectOf(React.PropTypes.func),
};

const mapStateToProps = (state) => ({
  tabs: EditorSelectors.getPreparedTabs(state),
  currentPatchId: EditorSelectors.getCurrentPatchId(state),
});

const mapDispatchToprops = (dispatch) => ({
  actions: bindActionCreators({
    switchPatch: Actions.switchPatch,
    closeTab: Actions.closeTab,
    sortTabs: Actions.sortTabs,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToprops)(Tabs);
