type t;

[@bs.new] [@bs.module] external create: unit => t = "events";

[@bs.send] external emit: (t, string, string) => bool = "emit";

[@bs.send] external on: (t, string, 'a => unit) => t = "on";
