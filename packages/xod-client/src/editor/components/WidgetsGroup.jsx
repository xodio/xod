import R from 'ramda';
import React from 'react';

class WidgetsGroup extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.props.createWidgetsConfig(props.entity);
  }

  componentWillReceiveProps(nextProps) {
    const shouldCreateComponents = !R.equals(this.props.entity, nextProps.entity);
    const widgetsData = this.props.createWidgetsConfig(nextProps.entity);
    const dataToUpdate = (shouldCreateComponents) ? widgetsData : R.pick(['props'], widgetsData);
    this.setState(dataToUpdate);
  }

  render() {
    const widgets = R.compose(
      R.values,
      R.mapObjIndexed((Widget, key) =>
        <li key={key}>
          <Widget
            {...this.state.props[key]}
            onPropUpdate={this.props.onPropUpdate}
          />
        </li>
      )
    )(this.state.components);

    return (
      <ul>
        {widgets}
      </ul>
    );
  }
}

WidgetsGroup.propTypes = {
  entity: React.PropTypes.any,
  // :: entity -> { components: {...}, props: {...} }
  createWidgetsConfig: React.PropTypes.func.isRequired,
  onPropUpdate: React.PropTypes.func.isRequired,
};

export default WidgetsGroup;
