type t;
type host = string;
type ip = string;
type dns = {
  address: ip,
  family: int,
};

[@bs.module "dns"] external dnsPromises: t = "promises";

[@bs.send] external lookup_: (t, host) => Js.Promise.t(dns) = "lookup";

let lookup = host =>
  lookup_(dnsPromises, host)
  |> Js.Promise.then_(res => Js.Promise.resolve(res.address));
