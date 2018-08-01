import React from 'react';
import { storiesOf } from '@storybook/react';

import * as XP from 'xod-project';

import '../src/core/styles/main.scss';
import PatchDocs from '../src/editor/components/PatchDocs';

// TODO: fragile import
import tutorialProject from '../../xod-client-browser/tutorialProject.json';

const emptyProject = XP.createProject();

storiesOf('PatchDocs', module)
  .add('ordinary node (flip-flop)', () => (
    <PatchDocs patch={tutorialProject.patches['xod/core/flip-flop']} />
  ))
  .add('relatively large node (map-range)', () => (
    <PatchDocs patch={tutorialProject.patches['xod/core/map-range']} />
  ))
  .add('big node, no outputs (text-lcd-16x2)', () => (
    <PatchDocs patch={tutorialProject.patches['xod/common-hardware/text-lcd-16x2']} />
  ))
  .add('no inputs (boot)', () => (
    <PatchDocs patch={tutorialProject.patches['xod/core/boot']} />
  ))
  .add('no pin descriptions (add)', () => (
    <PatchDocs patch={tutorialProject.patches['xod/core/add']} />
  ))
  .add('variadic (select)', () => (
    <PatchDocs patch={tutorialProject.patches['xod/core/select']} />
  ))
  .add('input terminal', () => (
    <PatchDocs patch={XP.getPatchByPathUnsafe('xod/patch-nodes/input-pulse', emptyProject)} />
  ))
  .add('output terminal', () => (
    <PatchDocs patch={XP.getPatchByPathUnsafe('xod/patch-nodes/output-number', emptyProject)} />
  ))
  .add('to-bus', () => (
    <PatchDocs patch={XP.getPatchByPathUnsafe('xod/patch-nodes/to-bus', emptyProject)} />
  ))
  .add('from-bus', () => (
    <PatchDocs patch={XP.getPatchByPathUnsafe('xod/patch-nodes/from-bus', emptyProject)} />
  ));
