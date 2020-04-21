open Belt;

type t =
  | AT
  | CIPSTATUS
  | CIFSR
  | CIPMUX(bool)
  | PING(Connection.Host.t)
  | CIPDOMAIN(Connection.Host.t)
  | CIPSTART(Connection.Link.t, Connection.t)
  | CIPSEND(Connection.Link.t, int)
  | CIPCLOSE(Connection.Link.t);

let stringify: t => string;

let parse: string => Result.t(t, Error.t);

let parseArguments: string => array(string);
