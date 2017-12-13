import React from 'react';
import { storiesOf } from '@storybook/react';

import * as XP from 'xod-project';

import '../src/core/styles/main.scss';
import PatchDocs from '../src/editor/components/PatchDocs';

// TODO: fragile import
import initialProject from '../../xod-client-browser/initialProject.json';

const emptyProject = XP.createProject();

storiesOf('PatchDocs', module)
  .add('ordinary node (flip-flop)', () => (
    <PatchDocs patch={initialProject.patches['xod/core/flip-flop']} />
  ))
  .add('relatively large node (map-range)', () => (
    <PatchDocs patch={initialProject.patches['xod/core/map-range']} />
  ))
  .add('big node, no outputs (text-lcd-16x2)', () => (
    <PatchDocs patch={initialProject.patches['xod/common-hardware/text-lcd-16x2']} />
  ))
  .add('no inputs (boot)', () => (
    <PatchDocs patch={initialProject.patches['xod/core/boot']} />
  ))
  .add('no pin descriptions (add)', () => (
    <PatchDocs patch={initialProject.patches['xod/core/add']} />
  ))
  .add('input terminal', () => (
    <PatchDocs patch={XP.getPatchByPathUnsafe('xod/patch-nodes/input-pulse', emptyProject)} />
  ))
  .add('output terminal', () => (
    <PatchDocs patch={XP.getPatchByPathUnsafe('xod/patch-nodes/output-number', emptyProject)} />
  ));

