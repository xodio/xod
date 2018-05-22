type t;

type path = PatchPath.t;

let create: unit => t;

let getPath: t => path;

let assocNode: (t, Node.t) => t;

let assocLink: (t, Link.t) => XResult.t(t);

let assocLinkExn: (t, Link.t) => t;

let listPins: t => list(Pin.t);

let listInputPins: t => list(Pin.t);

let listOutputPins: t => list(Pin.t);

let findPinByLabel:
  (t, string, ~normalize: bool, ~direction: option(Pin.direction)) =>
  option(Pin.t);

let getAttachments: t => list(Attachment.t);

let getTabtestContent: t => option(string);

let hasTabtest: t => bool;
