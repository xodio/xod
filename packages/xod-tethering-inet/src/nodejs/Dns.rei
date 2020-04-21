// A wrapper over the standard module `DNS` from NodeJs

type host = string;
type ip = string;
type dns = {
  address: ip,
  family: int,
};

// Makes a DNS lookup
let lookup: host => Js.Promise.t(ip);
