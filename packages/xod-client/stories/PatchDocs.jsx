import React from 'react';
import { storiesOf } from '@kadira/storybook';

import '../src/core/styles/main.scss';
import PatchDocs from '../src/editor/components/PatchDocs';

// TODO: fragile import
import initialProject from '../../xod-client-browser/initialProject.json';

const flipFlop = initialProject.patches['xod/core/flip-flop'];
const textLcd16x2 = initialProject.patches['xod/common-hardware/text-lcd-16x2'];
const mapRange = initialProject.patches['xod/core/map-range'];
const boot = initialProject.patches['xod/core/boot'];
const add = initialProject.patches['xod/core/add'];

storiesOf('PatchDocs', module)
  .add('ordinary node (flip-flop)', () => (
    <PatchDocs patch={flipFlop} />
  ))
  .add('relatively large node (map-range)', () => (
    <PatchDocs patch={mapRange} />
  ))
  .add('big node, no outputs (text-lcd-16x2)', () => (
    <PatchDocs patch={textLcd16x2} />
  ))
  .add('no inputs (boot)', () => (
    <PatchDocs patch={boot} />
  ))
  .add('no pin descriptions (add)', () => (
    <PatchDocs patch={add} />
  ));

