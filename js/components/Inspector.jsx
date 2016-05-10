import React from 'react';

import PropertyGrid from './PropertyGrid';
import PropertyGridRow from './PropertyGridRow';

export default class Inspector extends React.Component {
  render() {
    return (
      <div>
        <PropertyGrid>
          <PropertyGridRow name="Enabled" value={true} type="bool" />
          <PropertyGridRow name="Brightness" value={1} type="number" />
          <PropertyGridRow name="Brightness UOM" value="[0..1]" type="string" />
        </PropertyGrid>
      </div>
    );
  }
}
