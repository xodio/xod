import React from 'react';

import PropertyGrid from './PropertyGrid';
import PropertyGridRow from './PropertyGridRow';

import Node from '../models/node';


export default class Inspector extends React.Component {
  render() {
    let selection = this.props.selection.filter(x => x instanceof Node);
    let content = null;

    if (selection.length === 0) {
      content = <div>No nodes selected</div>;
    } else if (selection.length > 1) {
      content = <div>Multiple selection</div>;
    } else {
      let node = selection[0];
      let valueInputs = node.inputs().filter(input => input.isValueType());
      let rows = valueInputs.map(input => {
        return <PropertyGridRow
          key={input.name()}
          name={input.name()}
          value={input.defaultValue()}
          type={input.type()} />;
      });

      if (valueInputs.length === 0) {
        content = <div>No properties for selected node</div>;
      } else {
        content = <PropertyGrid>{rows}</PropertyGrid>;
      }
    }

    return (<div>{content}</div>);
  }
}
