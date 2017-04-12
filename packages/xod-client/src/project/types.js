import R from 'ramda';
import $ from 'sanctuary-def';

import XF from 'xod-func-tools';
import XP from 'xod-project';

/* Types are by convention starts with a capital leter, so: */
/* eslint-disable new-cap */

const packageName = 'xod-client';
const docUrl = 'http://xod.io/docs/dev/xod-client/#';

const Model = XF.Model(packageName, docUrl);

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
  position: Point,
});

export const RenderableNode = ExtendedModel('RenderableNode', XP.Node, {
  pins: $.StrMap(RenderablePin),
  label: $.String,
  size: Size,
  outputPinsSectionHeight: $.Number,
});

export const RenderableLink = ExtendedModel('RenderableLink', XP.Link, {
  type: XP.DataType,
  from: Point,
  to: Point,
});
