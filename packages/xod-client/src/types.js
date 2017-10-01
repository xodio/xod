import R from 'ramda';
import $ from 'sanctuary-def';

import XF from 'xod-func-tools';
import * as XP from 'xod-project';

import { SELECTION_ENTITY_TYPE } from './editor/constants';

/* Types are by convention starts with a capital leter, so: */
/* eslint-disable new-cap */

const packageName = 'xod-client';
const docUrl = 'http://xod.io/docs/dev/xod-client/#';

const AliasType = XF.AliasType(packageName, docUrl);
const Model = XF.Model(packageName, docUrl);
const OneOfType = XF.OneOfType(packageName, docUrl);
const EnumType = XF.EnumType(packageName, docUrl);

const ExtendedModel = (typeName, baseModel, schema) =>
  XF.NullaryType(
    packageName,
    docUrl,
    typeName,
    R.both(
      XF.hasType(baseModel),
      XF.hasType($.RecordType(schema))
    )
  );

export const Point = Model('Point', {
  x: $.Number,
  y: $.Number,
});

export const Size = Model('Point', {
  width: $.Number,
  height: $.Number,
});

export const RenderablePin = ExtendedModel('RenderablePin', XP.Pin, {
  nodeId: XP.NodeId,
  isConnected: $.Boolean,
  isBindable: $.Boolean,
  position: Point,
});

export const RenderableNode = ExtendedModel('RenderableNode', XP.Node, {
  pins: $.StrMap(RenderablePin),
  label: $.String,
  size: Size,
});

export const RenderableLink = ExtendedModel('RenderableLink', XP.Link, {
  type: XP.DataType,
  from: Point,
  to: Point,
});

export const RenderableComment = AliasType('RenderableComment', XP.Comment);

const RenderableEntity = OneOfType(
  'RenderableEntity',
  [RenderableNode, RenderableLink, RenderableComment]
);

export const SelectionEntityType = EnumType(
  'SelectionEntityType',
  R.values(SELECTION_ENTITY_TYPE)
);

export const RenderableSelection = Model('RenderableSelection', {
  entityType: SelectionEntityType,
  data: RenderableEntity,
});

export const ClipboardEntities = Model('ClipboardEntities', {
  nodes: $.Array(XP.Node),
  links: $.Array(XP.Link),
  comments: $.Array(XP.Comment),
});
