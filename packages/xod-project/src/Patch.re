open Belt;
open XodFuncTools;

type t = Js.Types.obj_val;

type path = PatchPath.t;

[@bs.module ".."] external create : unit => t = "createPatch";

[@bs.module ".."] external getPath : t => path = "getPatchPath";

[@bs.module ".."] external _assocNode : (Node.t, t) => t = "assocNode";

let assocNode = (patch, node) => _assocNode(node, patch);

[@bs.module ".."] external _dissocNode : (Node.id, t) => t = "dissocNode";

let dissocNode = (patch, nodeId) => _dissocNode(nodeId, patch);

[@bs.module ".."] external _listNodes : t => array(Node.t) = "listNodes";

[@bs.module ".."] external _getNodeById : (Node.id, t) => XodFuncTools.Maybe.t(Node.t) = "getNodeById";
let getNodeById = (patch, nodeId) => _getNodeById(nodeId, patch) |> Maybe.toOption;

[@bs.module ".."] external _upsertNodes : (array(Node.t), t) => t = "upsertNodes";

let upsertNodes = (patch, nodes) => _upsertNodes(List.toArray(nodes), patch);

let listNodes = patch => _listNodes(patch) |. List.fromArray;

[@bs.module ".."]
external _assocLink : (Link.t, t) => Either.t(Js.Exn.t, t) = "assocLink";

let assocLink = (patch, link) => _assocLink(link, patch) |> Either.toResult;

[@bs.module ".."]
external _upsertLinks : (array(Link.t), t) => Either.t(Js.Exn.t, t) = "upsertLinks";

let upsertLinks = (patch, links) => _upsertLinks(List.toArray(links), patch) |> Either.toResult;

let assocLinkExn = (link, patch) =>
  switch (assocLink(link, patch)) {
  | Ok(patch') => patch'
  | Error(err) =>
    /* TODO: use a rerise mechanism */
    Js.Exn.raiseError(err |> Js.Exn.message |. Option.getWithDefault(""))
  };

[@bs.module ".."] external _listLinks : t => array(Link.t) = "listLinks";

let listLinks = patch => _listLinks(patch) |. List.fromArray;

[@bs.module ".."] external _listPins : t => array(Pin.t) = "listPins";

let listPins = patch => _listPins(patch) |. List.fromArray;

[@bs.module ".."] external _omitLinks : (array(Link.t), t) => t = "omitLinks";

let omitLinks = (patch, links) => _omitLinks(List.toArray(links), patch);

[@bs.module ".."] external _getPinByKey : (Pin.key, t) => Maybe.t(Pin.t) = "getPinByKey";

let getPinByKey = (patch, pinKey) => _getPinByKey(pinKey, patch) |> Maybe.toOption;

let listInputPins = patch =>
  patch |. listPins |. List.keep(pin => Pin.getDirection(pin) == Pin.Input);

let listOutputPins = patch =>
  patch |. listPins |. List.keep(pin => Pin.getDirection(pin) == Pin.Output);

/* TODO: is it defined anywhere already? */
let identity = a => a;

let findPinByLabel = (patch, label, ~normalize, ~direction) : option(Pin.t) =>
  listPins(patch)
  |. (normalize ? Pin.normalizeLabels : identity)
  |. List.keep(pin => Pin.getLabel(pin) == label)
  |. (
    pins =>
      switch (direction) {
      | None => pins
      | Some(dir) => List.keep(pins, pin => Pin.getDirection(pin) == dir)
      }
  )
  |. (
    pins =>
      switch (pins) {
      | [onlyPin] => Some(onlyPin)
      | _ => None
      }
  );

[@bs.module ".."]
external _getAttachments : t => array(Attachment.t) = "getPatchAttachments";

let getAttachments = t => _getAttachments(t) |. List.fromArray;

let getTabtestContent = t =>
  getAttachments(t)
  |. List.keep(Attachment.isTabtest)
  |. List.head
  |. Option.map(Attachment.getContent);

let hasTabtest = t => getAttachments(t) |. List.some(Attachment.isTabtest);
