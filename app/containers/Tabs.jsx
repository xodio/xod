import R from 'ramda';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as Actions from '../actions';
import Selectors from '../selectors';

import TabsContainer from '../components/TabsContainer';
import TabsItem from '../components/TabsItem';

class Tabs extends React.Component {
  constructor(props) {
    super(props);

    this.switchPatch = this.switchPatch.bind(this);
    this.closeTab = this.closeTab.bind(this);
  }

  getTabs() {
    return R.values(this.props.tabs);
  }

  switchPatch(patchId) {
    return this.props.actions.switchPatch(patchId);
  }
  closeTab(patchId) {
    return this.props.actions.closeTab(patchId);
  }

  render() {
    const tabs = this.getTabs();

    return (
      <TabsContainer>
        {tabs.map(tab =>
          <TabsItem
            data={tab}
            key={tab.id}
            onClick={this.switchPatch}
            onClose={this.closeTab}
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
  }, dispatch),
});

export default connect(mapStateToProps, mapDispatchToprops)(Tabs);
