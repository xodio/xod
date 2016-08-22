import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../actions';
import Selectors from 'xod/client/selectors';

import TabsContainer from '../components/TabsContainer';
import TabsItem from '../components/TabsItem';

class Tabs extends React.Component {
  constructor(props) {
    super(props);

    this.onSwitchPatch = this.onSwitchPatch.bind(this);
    this.onCloseTab = this.onCloseTab.bind(this);
  }

  onSwitchPatch(patchId) {
    return this.props.actions.switchPatch(patchId);
  }

  onCloseTab(patchId) {
    return this.props.actions.closeTab(patchId);
  }

  getTabs() {
    return R.sortBy(
      R.prop('index')
    )(R.values(this.props.tabs));
  }

  render() {
    const tabs = this.getTabs();
    return (
      <TabsContainer>
        {tabs.map(tab =>
          <TabsItem
            key={tab.id}
            data={tab}
            onClick={this.onSwitchPatch}
            onClose={this.onCloseTab}
          />
        )}
      </TabsContainer>
    );
  }
}

Tabs.propTypes = {
  tabs: React.PropTypes.object,
  actions: React.PropTypes.objectOf(React.PropTypes.func),
};

const mapStateToProps = (state) => ({
  tabs: Selectors.Editor.getPreparedTabs(state),
  currentPatchId: Selectors.Editor.getCurrentPatchId(state),
});

const mapDispatchToprops = (dispatch) => ({
  actions: bindActionCreators({
    switchPatch: Actions.switchPatch,
    closeTab: Actions.closeTab,
    sortTabs: Actions.sortTabs,
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToprops)(Tabs);
