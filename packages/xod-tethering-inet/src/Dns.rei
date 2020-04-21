type host = string;
type ip = string;
type dns = {
  address: ip,
  family: int,
};

let lookup: host => Js.Promise.t(ip);
